import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  BuildingStorefrontIcon,
  ChartPieIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  CubeIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';


// --- Reusable Components ---

const SectionTitle = ({
  pretitle,
  title,
  subtitle,
  className = '',
}: {
  pretitle: string;
  title: string;
  subtitle: string;
  className?: string;
}) => (
  <div className={`mx-auto max-w-3xl text-center ${className}`}>
    <h2 className="text-base font-semibold leading-7 text-blue-600">{pretitle}</h2>
    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{title}</p>
    <p className="mt-6 text-lg leading-8 text-gray-600">{subtitle}</p>
  </div>
);

// --- Page Sections ---

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <header className="bg-white sticky top-0 z-50 shadow-sm">
            <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                    <a href="#" className="-m-1.5 p-1.5">
                        <span className="text-2xl font-bold text-blue-700">OneSalon</span>
                    </a>
                </div>
                <div className="flex lg:hidden">
                    <button type="button" onClick={() => setIsMenuOpen(true)} className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700">
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                </div>
                <div className="hidden lg:flex lg:gap-x-12">
                    <a href="#about-us" className="text-sm font-semibold leading-6 text-gray-900">About Us</a>
                    <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">Features</a>
                    <a href="#reviews" className="text-sm font-semibold leading-6 text-gray-900">Reviews</a>
                </div>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
                    <Link to="/LoginPage" className="text-sm font-semibold leading-6 text-gray-900">Salon Login</Link>
                    <Link to="/RegisterSalon" className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Register</Link>
                </div>
            </nav>
            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="lg:hidden">
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-25" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                         <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-blue-700">OneSalon</span>
                             <button type="button" onClick={() => setIsMenuOpen(false)} className="-m-2.5 rounded-md p-2.5 text-gray-700">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-gray-500/10">
                                <div className="space-y-2 py-6">
                                    <a href="#about-us" onClick={() => setIsMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">About Us</a>
                                    <a href="#features" onClick={() => setIsMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">Features</a>
                                    <a href="#reviews" onClick={() => setIsMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">Reviews</a>
                                </div>
                                <div className="py-6">
                                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">Salon Login</Link>
                                    <Link to="/register" onClick={() => setIsMenuOpen(false)} className="mt-2 -mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white bg-blue-600 hover:bg-blue-500">Register</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

const HeroSection = () => (
    <div className="bg-white">
        <div className="relative isolate pt-14">
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#809cff] to-[#3c5aff] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
            </div>
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Take Your Salon To The Next Level with <span className="text-blue-600">One Salon</span></h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Elevate your salon business with the ultimate solution designed to streamline operations, enhance client experience, and boost profitability.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link to="/register" className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Enroll Now</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const AboutUsSection = () => (
    <div id="about-us" className="bg-slate-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <SectionTitle
                pretitle="About Us"
                title="Revolutionizing the Salon Industry"
                subtitle="One Salon is dedicated to empowering salon owners with powerful tools that simplify operations, enhance customer experience, and drive business growth."
            />
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 text-base leading-7 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                <div>
                    <h3 className="pl-6 font-semibold text-gray-900 border-l-2 border-blue-600">Our Mission</h3>
                    <p className="mt-2 pl-6 text-gray-600">To provide a comprehensive SaaS platform that streamlines appointment scheduling, optimizes inventory management, and facilitates seamless client communication.</p>
                </div>
                <div>
                    <h3 className="pl-6 font-semibold text-gray-900 border-l-2 border-blue-600">Our Team</h3>
                    <p className="mt-2 pl-6 text-gray-600">A group of dedicated professionals with expertise in salon management and technology, committed to delivering innovative solutions and exceptional support.</p>
                </div>
                <div>
                    <h3 className="pl-6 font-semibold text-gray-900 border-l-2 border-blue-600">Our Achievements</h3>
                    <p className="mt-2 pl-6 text-gray-600">Empowering hundreds of salons to streamline operations, resulting in over 10,000 happy customers across more than 500 salons.</p>
                </div>
            </div>
        </div>
    </div>
);

const FeaturesSection = () => {
    const features = [
        { name: 'POS Billing', description: 'Streamline transactions with our intuitive POS system for quick and efficient payments.', icon: CreditCardIcon },
        { name: 'CRM', description: 'Efficiently manage customer relationships with detailed profiles, history, and communication tools.', icon: UsersIcon },
        { name: 'Inventory', description: 'Manage purchases, add new products, track self-use stock, and optimize your inventory.', icon: CubeIcon },
        { name: 'Service Management', description: 'Offer and customize a wide range of salon services for all your clients.', icon: ClipboardDocumentListIcon },
        { name: 'Reports', description: 'Access detailed reports on billing, services, product sales, and employee performance.', icon: ChartPieIcon },
        { name: 'Statistics', description: 'Analyze key performance metrics and track growth trends to make informed business decisions.', icon: BuildingStorefrontIcon },
    ];
    return (
        <div id="features" className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <SectionTitle
                    pretitle="Our Features"
                    title="A Comprehensive Suite of Tools"
                    subtitle="Our software offers everything you need to elevate your salon's efficiency and customer satisfaction."
                />
                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
                    {features.map(feature => (
                        <div key={feature.name} className="flex gap-x-5">
                            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-blue-100">
                                <feature.icon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">{feature.name}</h3>
                                <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const BenefitsSection = () => {
    const benefits = ['Multiple Admins', 'Multiple Branches', 'Multiple Roles'];
    return (
        <div className="bg-slate-50 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
                    <SectionTitle
                        className="text-left max-w-xl"
                        pretitle="Benefits"
                        title="Set Up and Scale Your Business on OneSalon"
                        subtitle="Streamline your salon operations with comprehensive management tools designed for growth."
                    />
                    <div className="mt-10 flex flex-col gap-y-6">
                        {benefits.map(benefit => (
                            <div key={benefit} className="flex items-center gap-x-3">
                                <CheckBadgeIcon className="h-7 w-7 text-blue-600"/>
                                <span className="text-lg font-medium text-gray-800">{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReviewsSection = () => {
    const reviews = [
        { text: "One Salon has completely transformed the way we manage our salon. The POS system is intuitive and the customer service is outstanding!", name: "Sujith", location: "Luxe Locks, Coimbatore" },
        { text: "I love how One Salon makes scheduling and managing appointments so effortless. It's a game-changer for our business.", name: "Ramesh", location: "Bubbles Hair and Beauty, Hyderabad" },
        { text: "The inventory management feature is fantastic! It keeps us organized and helps us keep track of our products efficiently.", name: "Leela Sai", location: "Ideal Salon, Bengaluru" },
    ];
    return (
        <div id="reviews" className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <SectionTitle
                    pretitle="Reviews"
                    title="What Our Customers Say"
                    subtitle="Hear what our happy clients have to say about their experience with One Salon."
                />
                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {reviews.map(review => (
                        <div key={review.name} className="flex flex-col rounded-2xl bg-slate-50 p-8">
                            <blockquote className="flex-grow text-gray-900">
                                <p>{`“${review.text}”`}</p>
                            </blockquote>
                            <figcaption className="mt-6">
                                <div className="font-semibold">{review.name}</div>
                                <div className="text-gray-600">{review.location}</div>
                            </figcaption>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-900/10 py-6">
            <dt>
                <button onClick={() => setIsOpen(!isOpen)} className="flex w-full items-start justify-between text-left text-gray-900">
                    <span className="text-base font-semibold leading-7">{question}</span>
                    <span className="ml-6 flex h-7 items-center">
                        {isOpen ? <MinusIcon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
                    </span>
                </button>
            </dt>
            {isOpen && (
                 <dd className="mt-2 pr-12">
                    <p className="text-base leading-7 text-gray-600">{answer}</p>
                </dd>
            )}
        </div>
    );
};

const FaqSection = () => {
    const faqs = [
        { question: "What features does One Salon software offer?", answer: "One Salon offers a comprehensive suite of features including POS Billing, CRM, Inventory Management, Service Scheduling, Detailed Reports, and Statistics. It's designed to streamline your salon operations efficiently." },
        { question: "How can One Salon help manage my inventory?", answer: "Our Inventory Management allows you to track new purchases, add new products, and manage self-stock consumption. This helps you maintain optimal stock levels and avoid shortages or overstocking." },
        { question: "Can I manage multiple branches with One Salon?", answer: "Yes, One Salon supports multiple branches, enabling you to oversee all your locations from a single platform. This feature is ideal for expanding businesses that require centralized control." },
        { question: "How does One Salon handle customer relationship management (CRM)?", answer: "Our CRM features help you manage customer information, track their service history, and engage with them through personalized marketing campaigns. This helps in building strong customer relationships." },
        { question: "How secure is my data with One Salon?", answer: "One Salon prioritizes data security with robust encryption and secure data storage practices. Your business information and customer data are well-protected to ensure privacy and compliance." },
    ];
    return (
        <div className="bg-slate-50 py-24 sm:py-32">
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
                <SectionTitle
                    pretitle="FAQs"
                    title="Frequently Asked Questions"
                    subtitle="Have questions? We have answers. If you can't find what you're looking for, feel free to contact us."
                />
                <dl className="mt-10 space-y-4">
                    {faqs.map(faq => <FaqItem key={faq.question} {...faq} />)}
                </dl>
            </div>
        </div>
    );
};

const Footer = () => (
    <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                <div className="space-y-4">
                    <span className="text-2xl font-bold">OneSalon</span>
                    <p className="text-sm leading-6 text-gray-300">The ultimate SaaS solution to streamline operations, enhance client experience, and boost profitability for your salon.</p>
                    <div className="flex space-x-6">
                        <a href="#" className="text-gray-400 hover:text-white"><FaFacebookF /></a>
                        <a href="#" className="text-gray-400 hover:text-white"><FaInstagram /></a>
                        <a href="#" className="text-gray-400 hover:text-white"><FaTwitter /></a>
                        <a href="#" className="text-gray-400 hover:text-white"><FaLinkedinIn /></a>
                        <a href="#" className="text-gray-400 hover:text-white"><FaYoutube /></a>

                    </div>
                </div>
                <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                    <div>
                        <h3 className="text-sm font-semibold leading-6">Quick Links</h3>
                        <ul role="list" className="mt-6 space-y-4">
                            <li><a href="#about-us" className="text-sm leading-6 text-gray-300 hover:text-white">About Us</a></li>
                            <li><a href="#features" className="text-sm leading-6 text-gray-300 hover:text-white">Features</a></li>
                            <li><a href="#reviews" className="text-sm leading-6 text-gray-300 hover:text-white">Reviews</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold leading-6">Legal</h3>
                        <ul role="list" className="mt-6 space-y-4">
                            <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Privacy Policy</a></li>
                            <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Terms & Conditions</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="mt-16 border-t border-white/10 pt-8">
                <p className="text-center text-xs leading-5 text-gray-400">&copy; {new Date().getFullYear()} OneSalon by Formonex Solutions. All rights reserved.</p>
            </div>
        </div>
    </footer>
);


// --- Main HomePage Component ---
const HomePage = () => {
  return (
    <>
      <Header />
      <HeroSection />
      <AboutUsSection />
      <FeaturesSection />
      <BenefitsSection />
      <ReviewsSection />
      <FaqSection />
      <Footer />
    </>
  );
};

export default HomePage;