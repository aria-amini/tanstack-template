import { RuleTester } from 'vite-plus/lint/plugins-dev'
import { describe, it } from 'vite-plus/test'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only
