/**
 * SimpleLoginTest - Minimal test component
 *
 * Ultra prosty formularz do testowania czy React w ogóle działa
 */

import * as React from "react";

export const SimpleLoginTest: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  console.log("[SimpleTest] Component rendered, email:", email, "| password:", password ? "***" : "empty");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[SimpleTest] FORM SUBMITTED!", { email, password });
    alert(`Form submitted!\nEmail: ${email}\nPassword: ${password}`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Simple Test Form</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              console.log("[SimpleTest] Email changed:", e.target.value);
              setEmail(e.target.value);
            }}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="test@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              console.log("[SimpleTest] Password changed");
              setPassword(e.target.value);
            }}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="password"
          />
        </div>

        <button
          type="submit"
          onClick={() => console.log("[SimpleTest] Button clicked!")}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Test Submit
        </button>
      </form>

      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <p>Email: {email || "(empty)"}</p>
        <p>Password: {password ? "***" : "(empty)"}</p>
      </div>
    </div>
  );
};
