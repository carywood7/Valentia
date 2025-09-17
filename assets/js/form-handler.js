// Handles the lead capture form submission for Shalimar Marbella
// This script depends on jQuery. Ensure jquery-3.7.1.min.js is loaded BEFORE this script.

(function ($) {
  $(function () {
    $("form.shalimar-leads-form").each(function () {
      const $currentForm = $(this);
      const $currentSubmitButton = $currentForm.find(
        "button[type='submit'].shalimar-leads-form-submit-btn"
      );

      const phpLeadScriptURL =
        "https://shalimar-marbella.com/phpleads/leads.php";
      const n8nWebhookURL =
        "https://n8n.aryanshinde.in/webhook/shalimar-lead-webhook";
      const getIPUrl = "https://shalimar-marbella.com/phpleads/getip.php"; // Your PHP endpoint

      $currentForm.on("submit", async function (e) {
        e.preventDefault();
        $currentSubmitButton.prop("disabled", true).html("Submitting...");

        const formData = new FormData(this);
        const formObject = {};
        formData.forEach((value, key) => {
          formObject[key] = value;
        });

        // Fetch IP from your PHP endpoint
        let ipAddress = "unknown";
        try {
          const ipResponse = await fetch(getIPUrl);
          if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            ipAddress = ipData.ip;
          } else {
            console.warn(
              "Failed to fetch IP address from getip.php:",
              ipResponse.statusText
            );
          }
        } catch (ipError) {
          console.error("Error fetching IP address:", ipError);
        }

        // Get IST timestamp
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(Date.now() + istOffset);
        const timestamp = istDate.toISOString().replace("T", " ").split(".")[0];

        const payload = {
          name: formObject.name || "No Name",
          email: formObject.email || "noemail@example.com",
          phone: formObject.phone || "0000000000",
          preference: formObject.preference || "Not specified",
          message: formObject.message || "No message provided.",
          source: "google",
        };

        const fullPayload = {
          ...payload,
          timestamp: timestamp,
          ip_address: ipAddress, // Server IP address here
        };

        try {
          // Send to PHP backend
          const response = await fetch(phpLeadScriptURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(
              `Network response was not ok: ${response.status} ${response.statusText}. Details: ${text}`
            );
          }

          const data = await response.json();
          console.log("PHP Script Response:", data);

          // Send to N8N webhook (fire & forget)
          fetch(n8nWebhookURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fullPayload),
          }).catch((err) => {
            console.warn("N8N webhook failed:", err);
          });

          $currentForm[0].reset();

          let successMessage =
            "Thank you for contacting us, we'll get back to you soon!";
          if (
            data &&
            data.error &&
            Array.isArray(data.error) &&
            data.error.length > 0
          ) {
            successMessage = data.error.join("\n");
          } else if (data && data.message) {
            successMessage = data.message;
          }

          $currentSubmitButton
            .html(`<span style="color: green;">Message Sent ✓</span>`)
            .prop("disabled", true);

          setTimeout(() => {
            $currentSubmitButton
              .prop("disabled", false)
              .html(`<span>Submit</span>`);
            window.location.href =
              "https://shalimar-marbella.com/thankyou.html";
          }, 500);
        } catch (error) {
          console.error("Error submitting to PHP script:", error);
          alert("Submission failed. Error: " + error.message);
          $currentSubmitButton
            .html(`<span style="color: red;">Error! Try Again</span>`)
            .prop("disabled", false);

          setTimeout(() => {
            $currentSubmitButton
              .prop("disabled", false)
              .html(`<span>Submit</span>`);
          }, 3000);
        }
      });
    });
  });
})(jQuery);
