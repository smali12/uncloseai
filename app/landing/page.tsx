'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Brain, Code } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight">UncloseAI</div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition">
              Pricing
            </a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <div className="absolute w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block px-3 py-1 mb-6 text-xs font-medium text-muted-foreground border border-border rounded-full">
              Advanced AI at your fingertips
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Powerful AI conversations, instantly
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Experience cutting-edge AI models for coding, writing, analysis, and creative work. Built for professionals who demand precision and speed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition inline-flex items-center gap-2"
              >
                Start chatting now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signin"
                className="px-6 py-3 border border-border rounded-full font-medium hover:bg-secondary transition"
              >
                Sign in to existing account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Features built for power users</h2>
          <p className="text-muted-foreground text-lg">
            Everything you need for productive AI conversations
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:bg-secondary transition">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Advanced Models</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Choose from Hermes for general tasks or Qwen Coder for specialized programming work.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:bg-secondary transition">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Streaming</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Watch responses stream in real-time for immediate feedback. Never wait for complete answers.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:bg-secondary transition">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Code Highlighting</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Beautiful syntax highlighting for 100+ languages with copy-to-clipboard support.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:bg-secondary transition">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Conversation History</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Keep all your conversations organized and searchable. Access your ideas anytime.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:bg-secondary transition">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Customizable Settings</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Control temperature, token limits, theme, and more to match your workflow.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-lg border border-border bg-card hover:bg-secondary transition">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Control your data with granular privacy settings and optional opt-out options.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg">
            Start free. Scale as you grow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="p-8 rounded-lg border border-border bg-card">
            <h3 className="text-xl font-semibold mb-2">Starter</h3>
            <p className="text-muted-foreground text-sm mb-6">Perfect for exploring</p>
            <div className="text-3xl font-bold mb-6">Free</div>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                100 messages/month
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                All AI models
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Conversation history
              </li>
            </ul>
            <Link
              href="/signup"
              className="w-full py-2 border border-border rounded-full text-center hover:bg-secondary transition"
            >
              Get started
            </Link>
          </div>

          {/* Pro */}
          <div className="p-8 rounded-lg border border-primary bg-card relative">
            <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
              Popular
            </div>
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-muted-foreground text-sm mb-6">For power users</p>
            <div className="text-3xl font-bold mb-1">$10</div>
            <p className="text-muted-foreground text-xs mb-6">/month</p>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Unlimited messages
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Priority support
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Advanced customization
              </li>
            </ul>
            <Link
              href="/signup"
              className="w-full py-2 bg-primary text-primary-foreground rounded-full text-center hover:opacity-90 transition"
            >
              Start free trial
            </Link>
          </div>

          {/* Enterprise */}
          <div className="p-8 rounded-lg border border-border bg-card">
            <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
            <p className="text-muted-foreground text-sm mb-6">For organizations</p>
            <div className="text-3xl font-bold mb-6">Custom</div>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Custom limits
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Dedicated support
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                API access
              </li>
            </ul>
            <button className="w-full py-2 border border-border rounded-full text-center hover:bg-secondary transition">
              Contact sales
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center border-t border-border">
        <h2 className="text-4xl font-bold mb-6">Ready to experience advanced AI?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join thousands of professionals using UncloseAI for work that matters.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition"
        >
          Get started free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">About</a></li>
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Docs</a></li>
                <li><a href="#" className="hover:text-foreground transition">API</a></li>
                <li><a href="#" className="hover:text-foreground transition">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>&copy; 2026 UncloseAI. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-foreground transition">Twitter</a>
              <a href="#" className="hover:text-foreground transition">GitHub</a>
              <a href="#" className="hover:text-foreground transition">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
