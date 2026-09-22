import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-background pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="font-serif text-2xl font-bold tracking-tight text-primary">
                Jodibanao
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              A trusted matchmaking platform for South Asian users to find life partners based on compatibility, values, religion, and family background.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif font-semibold text-foreground mb-4 text-lg">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/browse" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                  Browse Profiles
                </Link>
              </li>
              <li>
                <Link href="/success-stories" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link href="/membership" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                  Premium Plans
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                  Register Free
                </Link>
              </li>
            </ul>
          </div>

          {/* Guidelines */}
          <div>
            <h3 className="font-serif font-semibold text-foreground mb-4 text-lg">Information</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter / App */}
          <div>
            <h3 className="font-serif font-semibold text-foreground mb-4 text-lg">Stay Connected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join our newsletter for matchmaking tips and success stories.
            </p>
            {/* Simple mock subscribe form */}
            <div className="flex w-full max-w-sm items-center space-x-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring"
              />
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary-hover h-9 px-4 py-2 shadow-sm">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            &copy; {currentYear} Jodibanao Matrimonial. All rights reserved. Original Product.
          </p>
          <div className="flex gap-4">
            <span className="text-xs text-muted-foreground">English | हिंदी</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
