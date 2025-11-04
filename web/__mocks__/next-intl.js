/**
 * next-intl mock that returns real Dutch translations from src/messages/nl.json
 * so component tests that assert on visible text can use the localized strings.
 */

const React = require("react");
const messages = require("../src/messages/nl.json");

function getMessage(key, vars) {
  if (!key) return "";
  const parts = key.split(".");
  let node = messages;
  for (const p of parts) {
    if (node && Object.prototype.hasOwnProperty.call(node, p)) {
      node = node[p];
    } else {
      node = undefined;
      break;
    }
  }
  if (node === undefined) {
    // Fallback: return the key so tests still see something meaningful
    return key;
  }
  let text = node;
  if (vars && typeof vars === "object") {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}

function useTranslations() {
  return (key, vars) => getMessage(key, vars);
}

function useFormatter() {
  return {
    formatDate: (d) => (d ? new Date(d).toLocaleString("nl-NL") : ""),
    formatNumber: (n) => {
      if (n === null || n === undefined) return "";
      return new Intl.NumberFormat("nl-NL").format(n);
    },
  };
}

function NextIntlClientProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

module.exports = {
  useTranslations,
  useFormatter,
  NextIntlClientProvider,
  default: {
    useTranslations,
    useFormatter,
    NextIntlClientProvider,
  },
};
