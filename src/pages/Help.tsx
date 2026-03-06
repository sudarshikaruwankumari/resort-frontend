import React from 'react';
import { Phone, Mail, User, HelpCircle, MessageCircle, AlertCircle } from 'lucide-react';

function Help() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">How Can We Help You?</h1>
          <p className="text-blue-100">Find answers to common questions or contact our support team</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Help Sections */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <User className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Account Help</h3>
            <p className="text-gray-600 text-sm">Learn how to create account, login, and manage your profile settings</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Booking Guide</h3>
            <p className="text-gray-600 text-sm">Step-by-step guide on how to book rooms and check availability</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">FAQ</h3>
            <p className="text-gray-600 text-sm">Frequently asked questions about payments, cancellations, and more</p>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
            Quick Instructions Guide
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-medium">🔐 Authentication</h3>
              <p className="text-gray-600 text-sm">Use your username, email, and password to login to your account</p>
            </div>

            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-medium">🏨 Adding Rooms</h3>
              <p className="text-gray-600 text-sm">Fill in room name, description, price, and upload images</p>
            </div>

            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-medium">📅 Booking</h3>
              <p className="text-gray-600 text-sm">Check room availability by selecting dates and number of guests</p>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
          
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Support Agent</p>
                <p className="font-medium">Sudarshika</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium">076 488 7080</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-medium">sudarshika2005@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              📞 Available Mon-Fri: 9:00 AM - 6:00 PM
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Need immediate assistance? Contact Sudarshika directly</p>
        </div>
      </div>
    </div>
  );
}

export default Help;