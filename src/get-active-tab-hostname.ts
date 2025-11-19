import { runAppleScript } from "@raycast/utils";
import { validateUrl } from "./utils";
import { getFrontmostApplication } from "@raycast/api";

export const getActiveTabHostname = async (): Promise<string | null> => {
  const frontmostApplication = await getFrontmostApplication();
  if (!frontmostApplication.bundleId) return null;
  if (frontmostApplication.name === "Cosense") return "scrapbox.io";

  const url = await runAppleScript(`
tell application "System Events"
    set frontApp to name of first process whose frontmost is true
end tell

set chromiumApps to {"Google Chrome", "Microsoft Edge", "Brave Browser", "Vivaldi", "Arc", "Cosense"}

if frontApp is "Safari" then
    tell application "Safari"
        if exists front document then
            return URL of front document
        else
            return missing value
        end if
    end tell

else if chromiumApps contains frontApp then
    using terms from application "Google Chrome"
        tell application frontApp
            if (exists front window) and (exists active tab of front window) then
                return URL of active tab of front window
            else
                return missing value
            end if
        end tell
    end using terms from

else if frontApp is "Firefox" then
    tell application "System Events"
        tell process "Firefox"
            try
                -- addressバーの AXValue を取得
                set addrBar to value of text field 1 of toolbar 1 of window 1
                return addrBar
            on error
                return missing value
            end try
        end tell
    end tell

else
    return missing value
end if`);

  const result = validateUrl(url);
  return result.ok ? result.url.hostname : null;
};
