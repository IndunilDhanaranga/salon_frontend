const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");

const notification = {
  id: "notice-1", title: "Team update", message: "Full notification message",
  type: "system", timestamp: new Date().toISOString(), read: false,
};

function loadComponent(file, context) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module, exports: module.exports,
    require: (name) => {
      if (name === "react") return { ...React, useState: () => ["all", () => {}] };
      if (name.includes("notification-context")) return { useNotifications: () => context };
      if (name === "@/lib/i18n") return { useTranslation: () => ({ language: "en", t: { common: {}, notifications: { unread: "Unread" } } }) };
      if (name.includes("broadcast-composer")) return { BroadcastComposerDialog: () => null };
      return require(name);
    },
  });
  return module.exports;
}

function find(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const result = find(child, predicate);
    if (result) return result;
  }
  return null;
}

for (const [file, exported, className] of [
  ["notification-drawer", "NotificationDrawer", "notification-item-open"],
  ["notification-toast", "NotificationToast", "notification-toast-open"],
]) {
  test(`${exported}: visible notification content opens details; dismiss remains independent`, () => {
    const opened = [];
    let dismissed = 0;
    const context = {
      isOpen: true, notifications: [notification], activeToast: notification,
      openNotification: (item) => opened.push(item),
      removeNotification: () => dismissed++, dismissToast: () => dismissed++,
    };
    const component = loadComponent(`src/features/business/notifications/components/${file}.tsx`, context)[exported];
    const tree = component();
    const button = find(tree, (node) => node.type === "button" && node.props.className === className);
    assert.ok(button, "notification content is a normal button, not an empty positioned overlay");
    assert.ok(find(button, (node) => node.props?.children === notification.message));
    assert.equal(button.props["aria-haspopup"], "dialog");
    button.props.onClick();
    assert.deepEqual(opened, [notification]);
    const dismiss = find(tree, (node) => node.type === "button" && /^(fb-dismiss-btn|toast-close-btn)$/.test(node.props.className));
    dismiss.props.onClick({ stopPropagation() {} });
    assert.equal(dismissed, 1);
    assert.equal(opened.length, 1);
  });
}
