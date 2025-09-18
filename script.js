const scriptURL = "https://script.google.com/macros/s/AKfycbzUhleF-OOJiW3qatTuMXOj4ELJiaAUcXR9KjK4nXfJ0U7Cb_f1UAbnG6-b22p2k6Ly/exec";

function attachFormHandler(formId) {
  const form = document.getElementById(formId);
  if (!form) {
    console.warn(`⚠️ Form with ID '${formId}' not found.`);
    return;
  }

  console.log(`✅ Handler attached to #${formId}`);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    console.log(`📩 Submitting #${formId}:`, Object.fromEntries(formData));

    fetch(scriptURL, { method: "POST", body: formData })
      .then((res) => res.text())
      .then((txt) => {
        console.log(`✅ Server response for #${formId}:`, txt);
        alert("✅ Submitted Successfully!");
        form.reset();
        window.location.href = "thankyou.html";
      })
      .catch((err) => {
        console.error(`❌ Error submitting #${formId}:`, err);
        alert("❌ Something went wrong, please try again!");
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  attachFormHandler("valentiaForm1"); // Hero form
  attachFormHandler("valentiaForm2"); // Footer form
});
