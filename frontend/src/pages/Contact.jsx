import { useState } from "react";
import { Send } from "lucide-react";
import { sendContactMessage } from "../services/api.js";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' or 'error'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // POST /api/contact (saved in MongoDB)
      await sendContactMessage(formData);
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact submission error:", err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1 className="h-display">Get in Touch</h1>
        <p>
          Questions about our heritage paths or wanting to partner? Leave us a
          message.
        </p>
      </div>

      <div className="contact-card">
        {status === "success" && (
          <div className="success-banner">
            ✨ Thank you! Your message has been sent successfully. We will get
            back to you shortly.
          </div>
        )}
        {status === "error" && (
          <div
            className="success-banner"
            style={{
              background: "#FCE8E6",
              color: "#C53929",
              borderColor: "#F5B4AD",
            }}
          >
            ⚠️ Your message was not sent. Add your name, email and message, then try again.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Sarah Owusu"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="sarah@email.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Question about learning paths"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">How can we help?</label>
            <textarea
              id="message"
              name="message"
              rows="6"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us what you are looking for..."
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: "10px" }}
          >
            {loading ? (
              "Sending Message..."
            ) : (
              <>
                <Send size={18} /> Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
