import React, { useState } from "react";
import Layout from "../../components/Layout";

const Contact = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setSubmitted(true);
                setFormData({ name: "", email: "", subject: "", message: "" });
                setTimeout(() => setSubmitted(false), 3000);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    return (
        <Layout title="My Resources">
            <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center py-16 px-4">
                <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12">

                    {/* LEFT CONTACT INFO CARD */}
                    <div className="bg-white p-10 rounded-2xl shadow-sm border">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">
                            Contact Us
                        </h2>

                        <p className="text-gray-600 mb-8">
                            We’d love to hear from you. Feel free to reach out using the details below.
                        </p>

                        <div className="space-y-7 text-gray-700">

                            <div className="flex items-start space-x-4">
                                <span className="text-2xl">📍</span>
                                <p className="leading-tight">
                                    Pradnyaadip Heights <br />
                                    Bhekrai Nagar, Pune
                                </p>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="text-2xl">📞</span>
                                <a
                                    href="tel:9766974720"
                                    className="hover:text-blue-600 transition"
                                >
                                    9766974720
                                </a>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="text-2xl">✉️</span>
                                <a
                                    href="mailto:info@bameetech.in"
                                    className="hover:text-blue-600 transition"
                                >
                                    info@bameetech.in
                                </a>
                            </div>

                            <div className="pt-4">
                                <p className="font-medium text-gray-800 mb-2">Social Links</p>
                                <div className="flex items-center space-x-4 text-xl">
                                    <a href="#" className="hover:text-blue-600 transition">📷</a>
                                    <a href="#" className="hover:text-blue-600 transition">📘</a>
                                    <a href="#" className="hover:text-blue-600 transition">𝕏</a>
                                    <a href="#" className="hover:text-blue-600 transition">▶️</a>
                                    <span className="text-sm text-gray-600 ml-1">/bameetech</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* RIGHT CONTACT FORM */}
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white p-10 rounded-2xl shadow-sm border"
                    >
                        <h3 className="text-3xl font-bold text-gray-800 mb-6">
                            Send us a message
                        </h3>

                        <div className="space-y-5">

                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg mt-1 bg-[#fdfdfd] focus:ring-2 focus:ring-blue-400 outline-none transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg mt-1 bg-[#fdfdfd] focus:ring-2 focus:ring-blue-400 outline-none transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg mt-1 bg-[#fdfdfd] focus:ring-2 focus:ring-blue-400 outline-none transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Message
                                </label>
                                <textarea
                                    name="message"
                                    rows="5"
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg mt-1 bg-[#fdfdfd] focus:ring-2 focus:ring-blue-400 outline-none transition"
                                    required
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg hover:bg-blue-700 transition"
                            >
                                Send Message
                            </button>

                            {submitted && (
                                <p className="text-green-600 font-semibold text-center mt-3">
                                    ✓ Message sent successfully!
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default Contact;
