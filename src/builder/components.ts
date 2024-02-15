import type {
  APIActionRowComponent,
  APIActionRowComponentTypes,
  APIButtonComponent,
  APISelectMenuComponent,
  APIButtonComponentWithCustomId,
  APIButtonComponentWithURL,
  APIStringSelectComponent,
  APIUserSelectComponent,
  APIRoleSelectComponent,
  APIMentionableSelectComponent,
  APIChannelSelectComponent,
  APITextInputComponent,
} from 'discord-api-types/v10'

type ComponentClass =
  | ComponentButton
  | ComponentButtonLink
  | ComponentSelect
  | ComponentUserSelect
  | ComponentRoleSelect
  | ComponentMentionableSelect
  | ComponentChannelSelect
  | ComponentTextInput

export class Components {
  #components: APIActionRowComponent<APIActionRowComponentTypes>[] = []
  components = (...e: (ComponentClass | APIActionRowComponentTypes)[]) => {
    if (this.#components.length >= 5) console.warn('You can have up to 5 Action Rows per message')
    const components = e.map(comp => {
      if (
        comp instanceof ComponentButton ||
        comp instanceof ComponentButtonLink ||
        comp instanceof ComponentSelect ||
        comp instanceof ComponentUserSelect ||
        comp instanceof ComponentRoleSelect ||
        comp instanceof ComponentMentionableSelect ||
        comp instanceof ComponentChannelSelect ||
        comp instanceof ComponentTextInput
      )
        return comp.build()
      return comp
    })
    this.#components.push({ type: 1, components })
    return this
  }
  build = () => this.#components
}

type OmitButton =
  | Omit<APIButtonComponentWithCustomId, 'type' | 'style'>
  | Omit<APIButtonComponentWithURL, 'type' | 'style' | 'url'>
class ButtonBase {
  protected uniqueStr: string
  protected component: APIButtonComponent
  constructor(str: string, style: 1 | 2 | 3 | 4 | 5) {
    this.uniqueStr = str + ';'
    this.component = style === 5 ? { type: 2, style, url: str } : { type: 2, style, custom_id: this.uniqueStr }
  }
  protected assign = (component: OmitButton) => {
    Object.assign(this.component, component)
    return this
  }
  label = (e: APIButtonComponent['label']) => this.assign({ label: e })
  emoji = (e: APIButtonComponent['emoji']) => this.assign({ emoji: e })
  disabled = (e: APIButtonComponent['disabled']) => this.assign({ disabled: e })
  build = () => this.component
}

type ButtonStyle = 'Primary' | 'Secondary' | 'Success' | 'Danger' | 'Link'

export class ComponentButton extends ButtonBase {
  /**
   * [Button Structure](https://discord.com/developers/docs/interactions/message-components#button-object-button-structure)
   * @param buttonStyle default 'Primary'
   */
  constructor(uniqueId: string, buttonStyle: ButtonStyle = 'Primary') {
    // prettier-ignore
    const style =
      buttonStyle === 'Primary' ? 1 :
      buttonStyle === 'Secondary' ? 2 :
      buttonStyle === 'Success' ? 3 :
      buttonStyle === 'Danger' ? 4 :
      1
    super(uniqueId, style)
  }
  custom_id = (e: APIButtonComponentWithCustomId['custom_id']) => this.assign({ custom_id: this.uniqueStr + e })
}
export class ComponentButtonLink extends ButtonBase {
  /**
   * [Button Structure](https://discord.com/developers/docs/interactions/message-components#button-object-button-structure)
   */
  constructor(url: string) {
    super(url, 5)
  }
}

type OmitSelect =
  | Omit<APIStringSelectComponent, 'type' | 'custom_id'>
  | Omit<APIUserSelectComponent, 'type' | 'custom_id'>
  | Omit<APIRoleSelectComponent, 'type' | 'custom_id'>
  | Omit<APIMentionableSelectComponent, 'type' | 'custom_id'>
  | Omit<APIChannelSelectComponent, 'type' | 'custom_id'>
class SelectBase {
  protected uniqueStr: string
  protected component: APISelectMenuComponent
  constructor(uniqueId: string, type: 3 | 5 | 6 | 7 | 8) {
    this.uniqueStr = uniqueId + ';'
    this.component = type === 3 ? { type, custom_id: this.uniqueStr, options: [] } : { type, custom_id: this.uniqueStr }
  }
  protected assign = (component: OmitSelect | { custom_id?: string }) => {
    Object.assign(this.component, component)
    return this
  }
  custom_id = (e: APISelectMenuComponent['custom_id']) => this.assign({ custom_id: this.uniqueStr + e })
  placeholder = (e: APISelectMenuComponent['placeholder']) => this.assign({ placeholder: e })
  min_values = (e: APISelectMenuComponent['min_values']) => this.assign({ min_values: e })
  max_values = (e: APISelectMenuComponent['max_values']) => this.assign({ max_values: e })
  disabled = (e: APISelectMenuComponent['disabled']) => this.assign({ disabled: e })
  build = () => this.component
}

export class ComponentSelect extends SelectBase {
  /**
   * [Select Structure](https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-menu-structure)
   * .options() require
   */
  constructor(uniqueId: string) {
    super(uniqueId, 3)
  }
  options = (e: APIStringSelectComponent['options']) => this.assign({ options: e })
}
export class ComponentUserSelect extends SelectBase {
  constructor(uniqueId: string) {
    super(uniqueId, 5)
  }
  default_values = (e: APIUserSelectComponent['default_values']) => this.assign({ default_values: e })
}
export class ComponentRoleSelect extends SelectBase {
  constructor(uniqueId: string) {
    super(uniqueId, 6)
  }
  default_values = (e: APIRoleSelectComponent['default_values']) => this.assign({ default_values: e })
}
export class ComponentMentionableSelect extends SelectBase {
  constructor(uniqueId: string) {
    super(uniqueId, 7)
  }
  default_values = (e: APIMentionableSelectComponent['default_values']) => this.assign({ default_values: e })
}
export class ComponentChannelSelect extends SelectBase {
  constructor(uniqueId: string) {
    super(uniqueId, 8)
  }
  channel_types = (e: APIChannelSelectComponent['channel_types']) => this.assign({ channel_types: e })
  default_values = (e: APIChannelSelectComponent['default_values']) => this.assign({ default_values: e })
}

export class ComponentTextInput {
  #uniqueStr: string
  #component: APITextInputComponent
  /**
   * [Text Input Structure](https://discord.com/developers/docs/interactions/message-components#text-input-object-text-input-structure)
   * @param inputStyle default 'Single'
   */
  constructor(uniqueId: string, label: string, inputStyle?: 'Single' | 'Multi') {
    this.#uniqueStr = uniqueId + ';'
    this.#component = { type: 4, custom_id: this.#uniqueStr, label, style: inputStyle === 'Multi' ? 2 : 1 }
  }
  #assign = (component: Omit<APITextInputComponent, 'type' | 'custom_id' | 'label' | 'style'>) => {
    Object.assign(this.#component, component)
    return this
  }
  // https://discord.com/developers/docs/interactions/message-components#text-input-object
  min_length = (e: APITextInputComponent['min_length']) => this.#assign({ min_length: e })
  max_length = (e: APITextInputComponent['max_length']) => this.#assign({ max_length: e })
  required = (e: APITextInputComponent['required']) => this.#assign({ required: e })
  value = (e: APITextInputComponent['value']) => this.#assign({ value: e })
  placeholder = (e: APITextInputComponent['placeholder']) => this.#assign({ placeholder: e })
  build = () => this.#component
}
