# Tier A+1 — ToolTrace Smooth Collapse Fix (Jump on Collapse)

## Problem
When all tool steps are done and the user collapses the `ToolTrace`, the
`AnimatePresence` unmounts the rows entirely → layout height drops from N rows
to 0 instantly → the surrounding content "jumps" upward. On re-expand, the
reverse jump happens. This is a layout instability bug, not a design issue.

## Fix
Replace `AnimatePresence` mount/unmount with a `max-height` transition that
collapses the container smoothly instead of unmounting:

### Before
```tsx
<AnimatePresence initial={false}>
  {open && (
    <motion.div key="rows" ... animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* rows */}
    </motion.div>
  )}
</AnimatePresence>
```

### After
```tsx
<motion.div
  data-testid="tooltrace-rows"
  animate={{ maxHeight: open ? Math.max(railH, 40) : 0, opacity: open ? 1 : 0 }}
  transition={{ duration: 0.3, ease: EXPO }}
  className="overflow-hidden"
  style={{ maxHeight: open ? Math.max(railH, 40) : 0 }}
>
  {/* rows always in DOM, just height-animated */}
</motion.div>
```

### Changes
- `client/src/components/chat/ToolTrace.tsx`: replaced `AnimatePresence` with
  `max-height` transition; removed unused `AnimatePresence` import
- `client/src/components/chat/ToolTrace.test.tsx`: updated 2 assertions —
  rows stay in DOM (`getAllByTestId` instead of `queryByTestId`); check
  `rows.style.maxHeight === "0px"` for collapsed state

## Verification
- [x] 7/7 ToolTrace tests pass
- [x] 102/102 client chat+hooks tests pass
- [x] Typecheck clean on chat files
