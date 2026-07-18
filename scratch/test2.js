async function run() {
  const res = await fetch("http://localhost:8000/api/v1/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Shrishti Garg",
      email: "shrishti125153160@akgec.ac.in",
      studentNumber: "25153160"
    })
  });
  const data = await res.json();
  console.log("RESPONSE:", data);
}
run();
