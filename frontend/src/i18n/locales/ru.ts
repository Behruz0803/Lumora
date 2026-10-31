import { ruContent } from './ru/content'
import { ruUi } from './ru/ui'

/** Russian dictionary: UI strings plus labels for the demo dataset. */
export const ru: Record<string, string> = { ...ruUi, ...ruContent }
