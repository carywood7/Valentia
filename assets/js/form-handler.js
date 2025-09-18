// Updated form-handler.js - Handles both existing Shalimar functionality and new Valentia Google Sheets integration
// This script depends on jQuery. Ensure jquery-3.7.1.min.js is loaded BEFORE this script.

(function ($) {
  $(function () {
    
    // EXISTING SHALIMAR MARBELLA FORM HANDLER (unchanged)
    $("form.shalimar-leads-form").each(function () {
      const $currentForm = $(this);
      const $currentSubmitButton = $currentForm.find(
        "button[type='submit'].shalimar-leads-form-submit-btn"
      );

      const phpLeadScriptURL =
        "https://shalimar-marbella.com/phpleads/leads.php";
      const n8nWebhookURL =
        "https://n8n.aryanshinde.in/webhook/shalimar-lead-webhook";
      const getIPUrl = "https://shalimar-marbella.com/phpleads/getip.php";

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
          ip_address: ipAddress,
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

    // NEW VALENTIA FORM HANDLER - Google Sheets Integration
    $("form.valentia-form").each(function () {
      const $currentForm = $(this);
      const $currentSubmitButton = $currentForm.find("button[type='submit']");

      // IMPORTANT: Replace this with your actual Google Apps Script deployment URL
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwaA4bMGVMjSe01TZGUAjCO1TOlYcXDs1rB98cFUCwsDAUB3fNFh0i-HMPuYzLUJ2GK/exec';

      $currentForm.on("submit", async function (e) {
        e.preventDefault();
        
        // Show loading state
        const originalText = $currentSubmitButton.html();
        $currentSubmitButton.prop("disabled", true).html('<span>Submitting...</span>');

        const formData = new FormData(this);
        const formObject = {};
        formData.forEach((value, key) => {
          formObject[key] = value;
        });

        // Validate required fields
        if (!formObject.name || !formObject.phone || !formObject.email) {
          showNotification('Please fill in all required fields.', 'error');
          $currentSubmitButton.prop("disabled", false).html(originalText);
          return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formObject.email)) {
          showNotification('Please enter a valid email address.', 'error');
          $currentSubmitButton.prop("disabled", false).html(originalText);
          return;
        }

        // Get IST timestamp
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(Date.now() + istOffset);
        const timestamp = istDate.toISOString().replace("T", " ").split(".")[0];

        const payload = {
          name: formObject.name,
          phone: formObject.phone,
          email: formObject.email,
          timestamp: timestamp,
          source: 'Valentia Website'
        };

        try {
          // Send to Google Sheets via Google Apps Script
          const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          // Show success message
          showNotification('Thank you! Your request has been submitted successfully. We will contact you soon.', 'success');
          
          // Reset form
          $currentForm[0].reset();
          
          // Change button to success state
          $currentSubmitButton
            .html(`<span style="color: green;">Request Sent ✓</span>`)
            .prop("disabled", true);

          // Redirect to thank you page after delay
          setTimeout(() => {
            $currentSubmitButton
              .prop("disabled", false)
              .html(originalText);
            window.location.href = 'thankyou.html';
          }, 2000);

        } catch (error) {
          console.error('Error submitting to Google Sheets:', error);
          showNotification('There was an error submitting your form. Please try again or call us directly at +91 9935660033.', 'error');
          
          $currentSubmitButton
            .html(`<span style="color: red;">Error! Try Again</span>`)
            .prop("disabled", false);

          setTimeout(() => {
            $currentSubmitButton
              .prop("disabled", false)
              .html(originalText);
          }, 3000);
        }
      });
    });

    // Function to show notifications (for Valentia forms)
    function showNotification(message, type = 'success') {
      // Remove existing notifications
      $('.form-notification').remove();
      
      // Create notification element
      const $notification = $(`
        <div class="form-notification ${type}" style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${type === 'success' ? '#4CAF50' : '#f44336'};
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          max-width: 350px;
          font-size: 14px;
          line-height: 1.4;
          font-family: Arial, sans-serif;
          transform: translateX(100%);
          opacity: 0;
          transition: all 0.3s ease-out;
        ">
          ${message}
          <span style="
            position: absolute;
            top: 5px;
            right: 10px;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
          ">&times;</span>
        </div>
      `);
      
      // Add to page
      $('body').append($notification);
      
      // Animate in
      setTimeout(() => {
        $notification.css({
          'transform': 'translateX(0)',
          'opacity': '1'
        });
      }, 10);
      
      // Close button functionality
      $notification.find('span').on('click', function() {
        $notification.remove();
      });
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        $notification.remove();
      }, 5000);
    }

    // Add form validation styling for Valentia forms
    const validationCSS = `
      <style>
        .form-control.error {
          border-color: #f44336 !important;
          box-shadow: 0 0 5px rgba(244, 67, 54, 0.3) !important;
        }
        .form-control.success {
          border-color: #4CAF50 !important;
        }
      </style>
    `;
    $('head').append(validationCSS);

    // Add real-time validation for Valentia forms
    $("form.valentia-form input[required]").each(function() {
      const $input = $(this);
      
      $input.on('blur', function() {
        validateField($input);
      });
      
      $input.on('input', function() {
        $input.removeClass('error success');
      });
    });

    // Field validation function
    function validateField($field) {
      const value = $field.val().trim();
      const fieldType = $field.attr('type');
      
      $field.removeClass('error success');
      
      if (!value) {
        $field.addClass('error');
        return false;
      }
      
      if (fieldType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          $field.addClass('error');
          return false;
        }
      }
      
      if (fieldType === 'tel') {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
          $field.addClass('error');
          return false;
        }
      }
      
      $field.addClass('success');
      return true;
    }

  });
})(jQuery);
