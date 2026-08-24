import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  KeyRound,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';
import HealthBadge from '../components/HealthBadge';
import Button from '../components/Button';

export default function LandingPage() {
  const steps = [
    {
      icon: Lock,
      title: '1. AES Symmetric Encryption',
      tag: 'Data Encryption',
      description:
        'Your file content is encrypted locally using AES-256 before transmission, ensuring high-throughput security for files of any size.',
    },
    {
      icon: KeyRound,
      title: '2. RSA Key Protection',
      tag: 'Key Exchange',
      description:
        'The temporary AES key is securely encrypted with the intended recipient’s RSA public key, ensuring only their private key can unlock it.',
    },
    {
      icon: FileCheck2,
      title: '3. SHA-256 Integrity Verification',
      tag: 'Tamper Proofing',
      description:
        'A cryptographic checksum is generated to verify that the downloaded file matches the exact original bit-for-bit with zero tampering.',
    },
  ];

  const features = [
    {
      title: 'Zero-Knowledge Architecture',
      description:
        'Files and encryption keys are protected so intermediate servers cannot access plaintext data.',
      icon: ShieldCheck,
    },
    {
      title: 'Decoupled Microservices',
      description:
        'Engineered with a high-performance FastAPI backend and a responsive React client for seamless scaling.',
      icon: Server,
    },
    {
      title: 'End-to-End Workflow',
      description:
        'Streamlined upload, hybrid key wrapping, and authenticated recipient decryption.',
      icon: Zap,
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Phase Pill */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-8 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>SecureDrop &mdash; Hybrid Cryptography Platform</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          SecureDrop
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-xl sm:text-2xl font-medium text-emerald-400">
          Secure File Sharing with Hybrid Cryptography
        </p>

        {/* Description */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          SecureDrop protects files and cryptographic keys through a hybrid cryptosystem.
          Share documents with confidence knowing your data is shielded by AES encryption,
          RSA key distribution, and SHA-256 integrity verification.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/dashboard">
            <Button size="lg" icon={ArrowRight}>
              Get Started
            </Button>
          </Link>
          <Link to="/send">
            <Button variant="secondary" size="lg">
              Send Secure File
            </Button>
          </Link>
        </div>

        {/* Backend API Health Status */}
        <div className="mt-12 w-full max-w-md mx-auto">
          <HealthBadge />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
            Architecture Overview
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How Hybrid Cryptography Works
          </h3>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            By pairing symmetric and asymmetric cryptography, SecureDrop provides both high-speed
            file encryption and secure key management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700/60">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/40">
                      {step.tag}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2">{step.title}</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="flex space-x-4 p-4 rounded-lg bg-slate-900/20 border border-slate-800/60">
                <div className="shrink-0 p-2 text-emerald-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{feature.title}</h4>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
