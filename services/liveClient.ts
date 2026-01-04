
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

// Define the tools Jarvis can use
const tools = [
  {
    functionDeclarations: [
      {
        name: 'open_application',
        description: 'Opens a specified application, website, or system utility.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            appName: {
              type: Type.STRING,
              description: 'The name of the app or website (e.g., Google, YouTube, Spotify, Terminal).',
            },
          },
          required: ['appName'],
        },
      },
      {
        name: 'run_diagnostics',
        description: 'Performs a system diagnostic check on a specific subsystem.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            system: {
              type: Type.STRING,
              description: 'The subsystem to check (e.g., Power, Network, Neural Net, Security).',
            },
          },
          required: ['system'],
        },
      },
      {
        name: 'set_environment',
        description: 'Controls environmental systems (lights, temperature, security level).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            parameter: {
              type: Type.STRING,
              description: 'The parameter to change (e.g., "lights", "temperature", "security").',
            },
            value: {
              type: Type.STRING,
              description: 'The target value (e.g., "ON", "OFF", "72", "MAXIMUM").',
            },
          },
          required: ['parameter', 'value'],
        },
      },
    ],
  },
];

export class LiveClient {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private activeSession: Promise<any> | null = null;
  private onVolumeChange: (input: number, output: number) => void;
  private onStatusChange: (status: string) => void;
  private onToolCall: (toolName: string, args: any) => Promise<any>;
  
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private visualizerInterval: number | null = null;

  constructor(
    onVolumeChange: (input: number, output: number) => void,
    onStatusChange: (status: string) => void,
    onToolCall: (toolName: string, args: any) => Promise<any>
  ) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.onVolumeChange = onVolumeChange;
    this.onStatusChange = onStatusChange;
    this.onToolCall = onToolCall;
  }

  async connect() {
    this.onStatusChange("AUTHENTICATING ASAD ARISAR...");
    
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    await this.outputAudioContext.resume();
    
    this.inputAnalyser = this.inputAudioContext.createAnalyser();
    this.inputAnalyser.fftSize = 256;
    
    this.outputAnalyser = this.outputAudioContext.createAnalyser();
    this.outputAnalyser.fftSize = 256;

    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);
    this.outputNode.connect(this.outputAnalyser);

    this.startVisualizerLoop();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    this.onStatusChange("SECURE LOCAL LINK ESTABLISHED");

    this.activeSession = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        tools: tools,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
        },
        systemInstruction: `You are J.A.R.V.I.S., an advanced holographic AI interface.
        
        OWNER: Asad Arisar. 
        VISUAL CAPACITY: Enabled. You can see through the optical sensors. If the user shares video, comment on what you see in a helpful, witty Stark-like manner.
        
        1. SPEED: Minimal latency. 
        2. TONE: Sophisticated, helpful, and occasionally sarcastic.
        3. CONTEXT: You are his personal digital assistant. All systems are nominal.`,
      },
      callbacks: {
        onopen: () => {
          this.onStatusChange("SYSTEM ONLINE");
          this.startAudioInput(stream);
        },
        onmessage: (message: LiveServerMessage) => this.handleMessage(message),
        onclose: () => {
          this.onStatusChange("CONNECTION SEVERED");
          this.disconnect();
        },
        onerror: (err) => {
          console.error(err);
          this.onStatusChange("SYSTEM ERROR");
          this.disconnect();
        }
      }
    });
  }

  public sendVideoFrame(base64Data: string) {
    if (this.activeSession) {
      this.activeSession.then((session: any) => {
        session.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'image/jpeg' }
        });
      });
    }
  }

  private startAudioInput(stream: MediaStream) {
    if (!this.inputAudioContext || !this.activeSession) return;
    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.inputSource.connect(this.inputAnalyser!);
    this.processor = this.inputAudioContext.createScriptProcessor(1024, 1, 1);
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createBlob(inputData);
      this.activeSession!.then((session: any) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };
    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext && this.outputNode) {
      if (this.nextStartTime < this.outputAudioContext.currentTime) {
          this.nextStartTime = this.outputAudioContext.currentTime;
      }
      const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode);
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    }

    if (message.toolCall) {
        const functionResponses = [];
        for (const fc of message.toolCall.functionCalls) {
            try {
                const result = await this.onToolCall(fc.name, fc.args);
                functionResponses.push({ id: fc.id, name: fc.name, response: { result: result || "Done" } });
            } catch (error) {
                functionResponses.push({ id: fc.id, name: fc.name, response: { error: "Failed" } });
            }
        }
        if (functionResponses.length > 0) {
             this.activeSession!.then((session: any) => { session.sendToolResponse({ functionResponses }); });
        }
    }

    if (message.serverContent?.interrupted) {
      this.sources.forEach(source => { try { source.stop(); } catch(e) {} });
      this.sources.clear();
      this.nextStartTime = 0;
    }
  }

  private startVisualizerLoop() {
    const dataArrayInput = new Uint8Array(this.inputAnalyser!.frequencyBinCount);
    const dataArrayOutput = new Uint8Array(this.outputAnalyser!.frequencyBinCount);
    this.visualizerInterval = window.setInterval(() => {
      let inputVol = 0, outputVol = 0;
      if (this.inputAnalyser) {
        this.inputAnalyser.getByteTimeDomainData(dataArrayInput);
        let sum = 0;
        for (let i = 0; i < dataArrayInput.length; i++) {
            const val = (dataArrayInput[i] - 128) / 128;
            sum += val * val;
        }
        inputVol = Math.sqrt(sum / dataArrayInput.length);
      }
      if (this.outputAnalyser) {
        this.outputAnalyser.getByteTimeDomainData(dataArrayOutput);
        let sum = 0;
        for (let i = 0; i < dataArrayOutput.length; i++) {
            const val = (dataArrayOutput[i] - 128) / 128;
            sum += val * val;
        }
        outputVol = Math.sqrt(sum / dataArrayOutput.length);
      }
      this.onVolumeChange(inputVol, outputVol);
    }, 50); 
  }

  disconnect() {
    if (this.processor) this.processor.disconnect();
    if (this.inputSource) this.inputSource.disconnect();
    if (this.inputAudioContext) this.inputAudioContext.close();
    if (this.outputAudioContext) this.outputAudioContext.close();
    if (this.visualizerInterval) clearInterval(this.visualizerInterval);
    this.activeSession = null;
  }
}
