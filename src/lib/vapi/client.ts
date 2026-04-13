import Vapi from "@vapi-ai/web";

let instance: Vapi | null = null;

export function getVapiClient(): Vapi {
  if (!instance) {
    instance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
  }
  return instance;
}

export function destroyVapiClient(): void {
  instance = null;
}
