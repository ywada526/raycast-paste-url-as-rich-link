import {
  BrowserExtension,
  Clipboard,
  confirmAlert,
  environment,
  getFrontmostApplication,
  open,
  showToast,
  Toast,
} from "@raycast/api";
import { escapeHTML, validateUrl } from "./utils";

export default async function pasteUrlAsRichLink() {
  if (!environment.canAccess(BrowserExtension)) {
    await confirmAlert({
      title: "Raycast Browser Extension Required",
      message: "Please install the Raycast browser extension to use this command",
      primaryAction: {
        title: "Open Extension Page",
        onAction: async () => {
          await open("https://www.raycast.com/browser-extension");
        },
      },
    });
    return;
  }

  showToast({
    style: Toast.Style.Animated,
    title: "Getting link...",
  });

  const clipboardText = (await Clipboard.readText()) ?? "";
  const clipboardTextResult = validateUrl(clipboardText);
  if (!clipboardTextResult.ok) {
    console.error(clipboardTextResult.error.message);
    showToast({
      style: Toast.Style.Failure,
      title: `Invalid URL: ${clipboardText}`,
    });
    return;
  }
  const url = clipboardTextResult.url;

  const tabs = await BrowserExtension.getTabs();
  const title = tabs.find((tab) => tab.url === url.href)?.title;
  if (!title) {
    showToast({
      style: Toast.Style.Failure,
      title: `Failed to get page title: ${url.href}`,
    });
    return;
  }

  const scrapboxLink = `[${title} ${url.href}]`;
  const markdownLink = `[${title}](${url.href})`;
  const richLink = `<a href="${escapeHTML(url.href)}">${escapeHTML(title ?? "")}</a>`;

  const activeTabUrl = tabs.find((tab) => tab.active)?.url ?? "";
  const activeTabUrlResult = validateUrl(activeTabUrl);
  const activeTabHostname = activeTabUrlResult.ok ? activeTabUrlResult.url.hostname : "";

  const isFrontMostApplicationChrome = (await getFrontmostApplication()).bundleId?.startsWith("com.google.Chrome");

  if (isFrontMostApplicationChrome && activeTabHostname === "scrapbox.io") {
    await Clipboard.paste({ text: scrapboxLink });
  } else if (isFrontMostApplicationChrome && activeTabHostname === "github.com") {
    // When pasting Clipboard content with HTML into GitHub, GitHub generates a new markdown link using the text as the title, resulting in nested markdown. To avoid this, only the markdown link is pasted here.
    await Clipboard.paste({ text: markdownLink });
  } else {
    await Clipboard.paste({ html: richLink, text: markdownLink });
  }
}
