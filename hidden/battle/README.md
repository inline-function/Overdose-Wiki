# 战斗系统归档

这里存放暂时下线的战斗系统，不在 `tsconfig.json` 的 `src` 范围内，也不会被打包。

## 内容

- `src/battle/`：战斗引擎、神经递质、酶、状态、类型
- `src/pages/BattlePage.tsx`：战斗页面
- `src/test/battle.test.ts`：战斗单元测试
- `tests/e2e/battle.spec.ts`：战斗 e2e

## 当前状态

- 路由 `/battle/:id` 已重定向到首页。
- `DeckPage` 仍需要牌组校验，已把 `defaultDeck` / `validateDeck` 抽到 `src/game/deck.ts`。
- 其余 e2e 中涉及战斗的断言已移除，避免 CI 访问不存在的路由。
- 战斗数据 `src/content/private/battles.json`、`cards.json` 和类型定义仍保留在原处，方便恢复。

## 恢复方法

1. 把 `hidden/battle/src/battle` 移回 `src/battle`。
2. 把 `hidden/battle/src/pages/BattlePage.tsx` 移回 `src/pages/BattlePage.tsx`。
3. 把 `hidden/battle/src/test/battle.test.ts` 移回 `src/test/battle.test.ts`。
4. 把 `hidden/battle/tests/e2e/battle.spec.ts` 移回 `tests/e2e/battle.spec.ts`。
5. 把 `src/pages/DeckPage.tsx` 的引入改回 `../battle/engine`，或保留 `src/game/deck.ts`。
6. 恢复路由里的 `BattlePage` lazy import 和 `battle/:id` 路由。
7. 恢复被移除的战斗 e2e / a11y / audio / visual / smoke 用例。

注意：归档文件里的相对 import 是按原来的 `src/` 结构写的；直接在当前 `hidden/` 位置运行会找不到模块，恢复回 `src/` 后才有效。
