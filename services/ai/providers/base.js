/**
 * Base AI Provider Interface
 * All providers must implement this interface.
 */
export class BaseAIProvider {
  constructor(name) {
    this.name = name;
  }

  isConfigured() {
    throw new Error("Not implemented");
  }

  async generate(request) {
    throw new Error("Not implemented");
  }
}
