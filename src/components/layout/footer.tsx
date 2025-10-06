import Link from "next/link";
import { Package, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();



  return (
    <footer className="border-t bg-background overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-w-0">
        {/* Main footer content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left side - Company info and contact */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            {/* Company info */}
            <div>
              <Link href="/" className="flex items-center justify-center lg:justify-start space-x-2">
                <Package className="h-6 w-6" />
                <span className="font-bold">CompuCar</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground max-w-md">
                Your trusted partner for high-quality automotive parts and accessories. 
                We provide reliable, affordable solutions to keep your vehicle running at its best.
              </p>
            </div>
              
            {/* Contact info */}
            <div className="space-y-3">
              <div className="flex items-center justify-center lg:justify-start text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start text-sm text-muted-foreground">
                <Mail className="mr-2 h-4 w-4" />
                <span>support@compucar.com</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                <span>123 Auto Street, Car City, CC 12345</span>
              </div>
            </div>

            {/* Social media */}
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
                <Facebook className="h-4 w-4" />
                <span className="sr-only">Facebook</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
                <Instagram className="h-4 w-4" />
                <span className="sr-only">Instagram</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
                <Youtube className="h-4 w-4" />
                <span className="sr-only">YouTube</span>
              </Button>
            </div>
          </div>

          {/* Right side - Google Map */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md h-64 rounded-lg overflow-hidden border min-w-0">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3198.239595863534!2d3.184262576293571!3d36.71680657239541!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128e51bd06df07e3%3A0x7d18cafd8c3a9062!2sCompucar!5e0!3m2!1sen!2sdz!4v1754689389887!5m2!1sen!2sdz"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="CompuCar Location - Algeria"
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
        </div>



        <Separator className="my-4" />

        {/* Bottom footer */}
        <div className="flex flex-col items-center text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} CompuCar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}





