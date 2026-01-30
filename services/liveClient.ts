
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { encode, decode, decodeAudioData, createBlob } from '../utils/audioUtils';

export class LiveClient {
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  
  private onVolumeChange: (input: number, output: number) => void;
  private onStatusChange: (status: string) => void;
  private onTranscription: (text: string, isUser: boolean) => void;
  private onToolCall: (toolName: string, args: any) => Promise<any>;

  constructor(
    onVolumeChange: (input: number, output: number) => void,
    onStatusChange: (status: string) => void,
    onTranscription: (text: string, isUser: boolean) => void,
    onToolCall: (toolName: string, args: any) => Promise<any>
  ) {
    this.onVolumeChange = onVolumeChange;
    this.onStatusChange = onStatusChange;
    this.onTranscription = onTranscription;
    this.onToolCall = onToolCall;
  }

  async connect() {
    this.onStatusChange("INITIATING NEURAL LINK...");
    
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    await this.inputAudioContext.resume();
    await this.outputAudioContext.resume();

    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const ai = new GoogleGenAI({ apiKey: (process.env.API_KEY as string) });
    
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          this.onStatusChange("SYSTEM ONLINE");
          this.setupMicrophone(stream, sessionPromise);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
            this.handleAudioOutput(message.serverContent.modelTurn.parts[0].inlineData.data);
          }

          if (message.serverContent?.inputTranscription) {
            this.onTranscription(message.serverContent.inputTranscription.text, true);
          }
          if (message.serverContent?.outputTranscription) {
            this.onTranscription(message.serverContent.outputTranscription.text, false);
          }

          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              const result = await this.onToolCall(fc.name, fc.args);
              sessionPromise.then((session: any) => {
                session.sendToolResponse({
                  functionResponses: {
                    id: fc.id,
                    name: fc.name,
                    response: { result },
                  }
                });
              });
            }
          }

          if (message.serverContent?.interrupted) {
            this.stopAllAudio();
          }
        },
        onerror: (e: any) => {
          console.error("Live API Error:", e);
          this.onStatusChange("CORE ERROR");
        },
        onclose: () => {
          this.onStatusChange("LINK SEVERED");
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: "You are J.A.R.V.I.S., Tony Stark's AI. Address the user as 'Sir' or 'AsAD'. Be sophisticated, helpful, and concise. Your primary function is to manage the HUD. If the user says 'open [app name]' or 'Jarvis, pull up [app name]', use the `launch_app` tool immediately. Available apps are Security, Health, Terminal, Maps, and Weather. If they need information, use `web_search` to browse the global matrix.",
        tools: [
          {
            functionDeclarations: [
              {
                name: 'type_text',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    content: { type: Type.STRING, description: 'The text to copy.' }
                  },
                  required: ['content']
                },
                description: 'Sends text to the system and UI.'
              },
              {
                name: 'launch_app',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    app_id: { type: Type.STRING, description: 'The name of the module to launch: Security, Terminal, Health, Maps, Weather.' }
                  },
                  required: ['app_id']
                },
                description: 'Opens a holographic window for the specified system module.'
              },
              {
                name: 'web_search',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    query: { type: Type.STRING, description: 'The search query.' }
                  },
                  required: ['query']
                },
                description: 'Accesses the global matrix to find information.'
              }
            ]
          }
        ]
      }
    });

    this.session = await sessionPromise;
  }

  private setupMicrophone(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputAudioContext) return;
    const source = this.inputAudioContext.createMediaStreamSource(stream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < 100; i++) {
        const idx = Math.floor(Math.random() * inputData.length);
        sum += inputData[idx] * inputData[idx];
      }
      this.onVolumeChange(Math.sqrt(sum / 100), 0);

      const pcmBlob = createBlob(inputData);
      sessionPromise.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private async handleAudioOutput(base64: string) {
    if (!this.outputAudioContext || !this.outputNode) return;

    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
    const audioBuffer = await decodeAudioData(decode(base64), this.outputAudioContext, 24000, 1);
    
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);

    source.onended = () => {
      this.sources.delete(source);
      if (this.sources.size === 0) {
        this.onVolumeChange(0, 0);
      }
    };

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
    
    this.onVolumeChange(0, 0.6);
  }

  private stopAllAudio() {
    this.sources.forEach(s => s.stop());
    this.sources.clear();
    this.nextStartTime = 0;
    this.onVolumeChange(0, 0);
  }

  disconnect() {
    if (this.session) this.session.close();
    this.stopAllAudio();
    if (this.inputAudioContext) this.inputAudioContext.close();
    if (this.outputAudioContext) this.outputAudioContext.close();
  }
}
