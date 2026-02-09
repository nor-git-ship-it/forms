
document.addEventListener("d365mkt-afterformload", function () {
  // Badge-style prefix
  const LOG_PREFIX = " CRM-Website-IP-Log ";
  const BADGE_GREEN = "background:#28A745; color:#ffffff; padding:2px 6px; border-radius:999px; font-weight:bold;";
  const BADGE_RED   = "background:#DC3545; color:#ffffff; padding:2px 6px; border-radius:999px; font-weight:bold;";
  const BADGE_AMBER = "background:#FFC107; color:#000000; padding:2px 6px; border-radius:999px; font-weight:bold;";
  // Message styles
  const TXT_DEFAULT = "color:#333;";
  const TXT_SUCCESS = "color:#28A745; font-weight:500;";
  const TXT_ERROR   = "color:#DC3545; font-weight:600;";
  const TXT_WARN    = "color:#B08900; font-weight:600;"; // darker amber text
  // Helper loggers
  const logInfo    = (...msg) => console.log("%c" + LOG_PREFIX, BADGE_GREEN, "%c" + msg.join(" "), TXT_DEFAULT);
  const logSuccess = (...msg) => console.log("%c" + LOG_PREFIX, BADGE_GREEN, "%c" + msg.join(" "), TXT_SUCCESS);
  const logWarn    = (...msg) => console.warn("%c" + LOG_PREFIX, BADGE_AMBER, "%c" + msg.join(" "), TXT_WARN);
  const logError   = (...msg) => console.error("%c" + LOG_PREFIX, BADGE_RED, "%c" + msg.join(" "), TXT_ERROR);
  // Optional grouping (keeps logs tidy). Switch to groupCollapsed if preferred.
  console.group("%c" + LOG_PREFIX, BADGE_GREEN);
  logInfo("d365mkt-afterformload event fired");
  const apiKey = "3cc401d1ae024f8788bafd17650c9c08";
  const url = `https://ip-intelligence.abstractapi.com/v1/?api_key=${apiKey}`;
  // Fetch phase group
  console.group("%c" + LOG_PREFIX, BADGE_GREEN, "Fetch");
  logInfo("Fetching IP data from:", url);
  fetch(url)
    .then(response => {
      logInfo("Raw API response:", response);
      if (!response.ok) {
        throw new Error(`Network response was not OK (status ${response.status})`);
      }
      return response.json().catch(err => {
        throw new Error("Failed to parse JSON: " + err.message);
      });
    })
    .then(data => {
      logSuccess("Parsed API data successfully");
      logInfo("Data:", JSON.stringify(data));
      if (!data || !data.ip_address) {
        logWarn("'ip_address' missing in API response", JSON.stringify(data));
      }
      // Close fetch group
      console.groupEnd();
      // DOM write operations group
      console.group("%c" + LOG_PREFIX, BADGE_GREEN, "DOM Writes");
      // Full JSON as formatted string
      const AbstractAPI = JSON.stringify(data, null, 2);
      // IP address from API
      const IPAddress = data.ip_address || "";
      try {
        document.getElementById("shorttext126-1769510141430").value = IPAddress;
        logSuccess("Set IP address:", IPAddress);
      } catch (err) {
        logError("Could not write to IP address field:", err.message || err);
      }
      try {
        document.getElementById("longtext9522-1769509973042").value = AbstractAPI;
        logSuccess("Set JSON payload");
      } catch (err) {
        logError("Could not write JSON payload to field:", err.message || err);
      }
      // Close DOM writes group
      console.groupEnd();
      // Close top-level group
      console.groupEnd();
    })
    .catch(error => {
      // Try to close any open group gracefully
      try { console.groupEnd(); } catch (_) {}
      logError("FETCH ERROR →", error.message || error);
      try { console.groupEnd(); } catch (_) {}
    });
});
