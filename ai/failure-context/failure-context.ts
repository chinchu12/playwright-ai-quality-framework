export interface InteractiveElement {
  tag: string;
  role: string | null;
  text: string;
  ariaLabel: string | null;
  id: string | null;
  name: string | null;
  type: string | null;
  placeholder: string | null;
  associatedLabel: string | null;
  href: string | null;
}

export interface FailureContext {
  testName: string;
  url: string;
  pageTitle: string;
  visibleText: string;
  interactiveElements: InteractiveElement[];
  errorMessage: string;
  locator?: string;
  action?: string;
  screenshotPath?: string;
  timestamp: string;
}