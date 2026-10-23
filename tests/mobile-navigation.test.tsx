import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import LandingPage from "../src/app/page";
import { LandingNav } from "../src/components/LandingNav";
import { AuthScreen } from "../src/components/AuthScreen";

describe("Mobile navigation and clean workspace header", () => {
  it("renders a mobile hamburger button in the header", () => {
    const html = renderToStaticMarkup(<LandingNav />);

    // Hamburger button exists with accessibility attributes
    expect(html).toContain('aria-label="Open navigation menu"');
    expect(html).toContain('aria-controls="mobile-navigation-menu"');
    expect(html).toContain("sm:hidden");
  });

  it("organizes mobile navigation into Navigation and Account sections", () => {
    const html = renderToStaticMarkup(<LandingNav />);

    // Navigation section
    expect(html).toContain("Navigation");
    expect(html).toContain("What Is This?");
    expect(html).toContain("How It Works");
    expect(html).toContain("Meeting Workspace");
    expect(html).toContain('href="/what-is"');
    expect(html).toContain('href="/how-it-works"');
    expect(html).toContain('href="/#start"');

    // Account section
    expect(html).toContain("Account");
    expect(html).toContain("Sign In");
    expect(html).toContain("Sign Up");
    expect(html).toContain('href="/sign-in"');
    expect(html).toContain('href="/sign-up"');
  });

  it("provides desktop navigation with account access and section links", () => {
    const html = renderToStaticMarkup(<LandingNav />);

    // Desktop nav
    const desktopNavStart = html.indexOf('aria-label="Landing"');
    const desktopNav = html.slice(desktopNavStart, html.indexOf("</nav>", desktopNavStart));

    expect(desktopNav).toContain(">Tool<");
    expect(desktopNav).toContain(">What is this<");
    expect(desktopNav).toContain(">How it works<");
    expect(desktopNav).toContain(">Sign in<");
    expect(desktopNav).toContain(">Sign up<");
  });

  it("removes Sign In button and hides History and Export on mobile above the meeting notes form", () => {
    const html = renderToStaticMarkup(<LandingPage />);

    // The start section of the workspace contains the workspace top action bar
    const startSection = html.slice(html.indexOf('id="start"'), html.indexOf("Meeting notes"));

    // Sign In button should NOT be in the workspace top action bar
    expect(startSection).not.toContain(">Sign in<");
    expect(startSection).not.toContain(">Sign out<");

    // History and Export are hidden on mobile (hidden sm:inline-flex) since they live in the mobile hamburger
    expect(startSection).toContain("hidden font-brand whitespace-nowrap sm:inline-flex");
    expect(startSection).toContain("History");
    expect(startSection).toContain("Export");
    expect(startSection).toContain("New meeting");
    expect(startSection).toContain("whitespace-nowrap");
  });

  it("includes History and Export actions inside the mobile hamburger menu", () => {
    const html = renderToStaticMarkup(<LandingNav />);

    const menuStart = html.indexOf('id="mobile-navigation-menu"');
    const menu = html.slice(menuStart);

    expect(menu).toContain("Workspace Actions");
    expect(menu).toContain("History");
    expect(menu).toContain("Export");
  });

  it("ensures mobile navigation panel has an opaque background and dark backdrop", () => {
    const html = renderToStaticMarkup(<LandingNav />);

    const menuStart = html.indexOf('id="mobile-navigation-menu"');
    const menuTag = html.slice(menuStart, html.indexOf(">", menuStart) + 1);

    expect(menuTag).toContain("bg-card");
    expect(html).toContain("bg-black/50");
  });

  it("removes Continue as Guest button from the authentication screens", () => {
    const signInHtml = renderToStaticMarkup(<AuthScreen mode="sign-in" />);
    const signUpHtml = renderToStaticMarkup(<AuthScreen mode="sign-up" />);

    // Neither screen should display "Continue as guest"
    expect(signInHtml).not.toContain("Continue as guest");
    expect(signUpHtml).not.toContain("Continue as guest");

    // Instead, back navigation points back to the workspace
    expect(signInHtml).toContain("Back to workspace");
    expect(signUpHtml).toContain("Back to workspace");
    expect(signInHtml).toContain('href="/"');
    expect(signUpHtml).toContain('href="/"');
  });
});
