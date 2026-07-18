async function run() {
  const res = await fetch("http://localhost:8000/api/v1/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test",
      email: "test2512345@akgec.ac.in",
      studentNumber: "2512345"
    })
  });
  const data = await res.json();
  console.log("RESPONSE:", data);
}
run();
