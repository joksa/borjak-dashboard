"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in duration-700">
        {/* 404 Number with gradient */}
        <div className="relative">
          <h1 className="text-[180px] md:text-[240px] font-bold leading-none bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text text-transparent select-none">
            404
          </h1>
          <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-br from-primary via-secondary to-accent -z-10" />
        </div>

        {/* Main message */}
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-150">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Страница није пронађена
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
            Жао нам је, али страница коју тражите не постоји или је премештена.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 animate-in slide-in-from-bottom-4 duration-700 delay-300">
          <Link
            href="/"
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/20 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            <Home className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Почетна страна</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-card border-2 border-border text-foreground rounded-lg font-semibold text-lg transition-all hover:scale-105 hover:border-primary hover:shadow-lg active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span>Назад</span>
          </button>
        </div>

        {/* Decorative elements */}
        <div className="pt-12 opacity-60 animate-in fade-in duration-700 delay-500">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Search className="w-5 h-5" />
            <p className="text-sm">
              Проверите URL адресу или се вратите на почетну страницу
            </p>
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
      </div>
    </div>
  );
}
