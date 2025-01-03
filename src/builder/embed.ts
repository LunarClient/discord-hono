import type { APIEmbed, APIEmbedField, EmbedType } from "discord-api-types/v10";
import { Builder } from "./utils";

export class Embed extends Builder<APIEmbed> {
  /**
   * [Embed Structure](https://discord.com/developers/docs/resources/message#embed-object)
   */
  constructor(initial: APIEmbed = {}) {
    super(initial);
  }
  /**
   * @param {string} e Length limit: 256 characters
   * @returns {this}
   */
  title = (e: string) => this.a({ title: e });
  /**
   * @deprecated Embed types should be considered deprecated and might be removed in a future API version
   * @param {EmbedType} e
   * @returns {this}
   */
  type = (e: EmbedType) => this.a({ type: e });
  /**
   * @param {string} e Length limit: 4096 characters
   * @returns {this}
   */
  description = (e: string) => this.a({ description: e });
  /**
   * @param {string} e
   * @returns {this}
   */
  url = (e: string) => this.a({ url: e });
  /**
   * @param {string} e ISO8601 timestamp
   * @returns {this}
   */
  timestamp = (e: string) => this.a({ timestamp: e });
  /**
   * @param {number} e
   * @returns {this}
   */
  color = (e: number) => this.a({ color: e });
  /**
   * [Footer Structure](https://discord.com/developers/docs/resources/message#embed-object-embed-footer-structure)
   * @param {APIEmbed["footer"]} e
   * @returns {this}
   */
  footer = (e: APIEmbed["footer"]) => this.a({ footer: e });
  /**
   * [Image Structure](https://discord.com/developers/docs/resources/message#embed-object-embed-image-structure)
   * @param {APIEmbed["image"]} e
   * @returns {this}
   */
  image = (e: APIEmbed["image"]) => this.a({ image: e });
  /**
   * [Thumbnail Structure](https://discord.com/developers/docs/resources/message#embed-object-embed-thumbnail-structure)
   * @param {APIEmbed["thumbnail"]} e
   * @returns {this}
   */
  thumbnail = (e: APIEmbed["thumbnail"]) => this.a({ thumbnail: e });
  /**
   * [Video Structure](https://discord.com/developers/docs/resources/message#embed-object-embed-video-structure)
   * @param {APIEmbed["video"]} e
   * @returns {this}
   */
  video = (e: APIEmbed["video"]) => this.a({ video: e });
  /**
   * [Provider Structure](https://discord.com/developers/docs/resources/message#embed-object-embed-provider-structure)
   * @param {APIEmbed["provider"]} e
   * @returns {this}
   */
  provider = (e: APIEmbed["provider"]) => this.a({ provider: e });
  /**
   * [Author Structure](https://discord.com/developers/docs/resources/message#embed-object-embed-author-structure)
   * @param {APIEmbed["author"]} e
   * @returns {this}
   */
  author = (e: APIEmbed["author"]) => this.a({ author: e });
  /**
   * [Field Structure](https://discord.com/developers/docs/resources/message#embed-object-embed-field-structure)
   * @param {...APIEmbedField} e Length limit: 25 field objects
   * @returns {this}
   */
  fields = (...e: APIEmbedField[]) => this.a({ fields: e });
}
