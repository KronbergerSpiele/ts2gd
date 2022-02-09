// this file will have dynamic content from our test infrastructure

@autoload
class Autoload extends Node2D {
  public hello = "hi"
}

export const AutoloadInstance = new Autoload()
