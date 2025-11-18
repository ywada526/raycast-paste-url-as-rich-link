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
import { escapeHTML, getPageTitle, validateUrl } from "./utils";

export default async function pasteUrlAsRichLink() {
  if (!environment.canAccess(BrowserExtension)) {
    await confirmAlert({
      title: "Browser Extension Required",
      message: "Please install the browser extension to use this command",
      primaryAction: {
        title: "Open Browser Extension",
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
  const clipboardTextValidateResult = validateUrl(clipboardText);
  if (!clipboardTextValidateResult.ok) {
    console.error(clipboardTextValidateResult.error.message);
    showToast({
      style: Toast.Style.Failure,
      title: `Invalid URL: ${clipboardText}`,
    });
    return;
  }
  const url = clipboardTextValidateResult.url;

  const getPageTitleResult = await getPageTitle(url.href);
  if (!getPageTitleResult.ok) {
    console.error(getPageTitleResult.error.message);
    showToast({
      style: Toast.Style.Failure,
      title: `Failed to get page title: ${url.href}`,
    });
    return;
  }
  const title = getPageTitleResult.title;

  const scrapboxLink = `[${title} ${url.href}]`;
  const markdownLink = `[${title}](${url.href})`;
  const richLink = `<a href="${escapeHTML(url.href)}">${escapeHTML(title ?? "")}</a>`;

  const activeTabUrl = (await BrowserExtension.getTabs()).find((tab) => tab.active)?.url ?? "";
  const activeTabUrlValidateResult = validateUrl(activeTabUrl);
  const activeTabHostname = activeTabUrlValidateResult.ok ? activeTabUrlValidateResult.url.hostname : "";

  const isFrontMostApplicationChrome = (await getFrontmostApplication()).bundleId?.startsWith("com.google.Chrome");

  if (isFrontMostApplicationChrome && activeTabHostname === "scrapbox.io") {
    await Clipboard.paste({ text: scrapboxLink });
  } else if (isFrontMostApplicationChrome && activeTabHostname === "github.com") {
    await Clipboard.paste({ text: markdownLink });
  } else {
    await Clipboard.paste({ html: richLink, text: markdownLink });
  }
}
