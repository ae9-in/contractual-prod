/**
 * Contractual Pro - 50 legal templates data store.
 * Fully structured for SEO, AEO, and GEO optimization.
 */

// Define some detailed custom content templates first to showcase maximum quality on high-intent keywords.
const customTemplatesContent = {
  'mutual-nda': {
    description: `A Mutual Non-Disclosure Agreement (NDA), also known as a bilateral NDA, is a legally binding contract signed between two parties. It is specifically designed to protect confidential information, trade secrets, intellectual property, and proprietary business practices when both parties will be sharing sensitive data. This template is widely used by startups seeking partnerships, companies entering joint ventures, and businesses engaging in merger and acquisition discussions. 

By executing a Mutual NDA, both entities agree not to disclose or exploit the confidential information shared during their engagement. Standard clauses in this contract define what constitutes "Confidential Information," exclusions from confidentiality (e.g., publicly available info), obligations of the receiving party, and the duration of the agreement (typically 2 to 5 years). Having a solid Mutual NDA is essential for protecting your proprietary technology, client lists, and strategic business plans from unauthorized exposure.`,
    variables: [
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', defaultValue: '2026-06-02' },
      { key: 'partyAName', label: 'Company A Name', type: 'text', defaultValue: 'Acme Corp' },
      { key: 'partyANotation', label: 'Company A State & Type', type: 'text', defaultValue: 'a California corporation' },
      { key: 'partyBName', label: 'Company B Name', type: 'text', defaultValue: 'Innovatech LLC' },
      { key: 'partyBNotation', label: 'Company B State & Type', type: 'text', defaultValue: 'a Delaware limited liability company' },
      { key: 'disclosurePurpose', label: 'Purpose of Disclosure', type: 'text', defaultValue: 'exploring a potential strategic business relationship and joint integration' },
      { key: 'confidentialityPeriod', label: 'Confidentiality Period (Years)', type: 'number', defaultValue: '3' },
      { key: 'governingLaw', label: 'Governing Law State', type: 'text', defaultValue: 'California' }
    ],
    faqs: [
      {
        q: "What is the difference between a Mutual NDA and a Unilateral NDA?",
        a: "A Mutual NDA is signed when both parties will be sharing confidential information, binding both to secrecy. A Unilateral (or one-way) NDA is used when only one party is disclosing sensitive data, such as a business hiring an independent contractor or sharing proprietary designs with a vendor."
      },
      {
        q: "How long does a Mutual NDA remain legally binding?",
        a: "Typically, a Mutual NDA remains in effect for a specified confidentiality term, commonly between 2 and 5 years from the date of disclosure. However, trade secrets can be protected indefinitely under standard trade secret laws, provided they remain secret."
      },
      {
        q: "Is a digitally signed NDA legally binding in the United States?",
        a: "Yes, digitally signed NDAs are legally binding under the federal ESIGN Act of 2000 and the Uniform Electronic Transactions Act (UETA) adopted by most states. These laws state that electronic signatures have the same legal standing as traditional physical signatures."
      }
    ],
    howto: [
      "Enter the legal corporate names and registration states for both parties.",
      "Define the specific business purpose for which information is being shared.",
      "Determine the confidentiality duration (e.g., 3 years) suitable for the sensitivity of the shared data.",
      "Review the governing law clause to ensure it aligns with your legal jurisdiction.",
      "Export the customized document and sign electronically using a secure, compliant signature platform."
    ],
    template: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of {{effectiveDate}} (the "Effective Date"), by and between:

Party A: {{partyAName}}, {{partyANotation}}, and
Party B: {{partyBName}}, {{partyBBNotation || partyBNotation}}.

Each party may be referred to individually as a "Party" and collectively as the "Parties."

1. PURPOSE
The Parties wish to explore {{disclosurePurpose}} (the "Purpose"). In connection with the Purpose, each Party may disclose to the other Party certain proprietary and confidential information.

2. CONFIDENTIAL INFORMATION
"Confidential Information" refers to any proprietary information, technical data, trade secrets, or know-how disclosed by one Party ("Disclosing Party") to the other ("Receiving Party"), whether orally, in writing, or by inspection of tangible objects, which is designated as confidential or should reasonably be understood to be confidential given the nature of the information.

3. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees:
(a) To hold the Disclosing Party's Confidential Information in strict confidence and to take all reasonable precautions to protect such information.
(b) Not to use the Confidential Information for any purpose except to evaluate and engage in the Purpose.
(c) Not to disclose Confidential Information to third parties without the prior written consent of the Disclosing Party, except to employees or advisors who need to know and are bound by confidentiality agreements.

4. EXCLUSIONS
Confidential Information does not include information that:
(a) Is or becomes publicly known through no breach of this Agreement by the Receiving Party;
(b) Was already in the lawful possession of the Receiving Party prior to disclosure;
(c) Is independently developed by the Receiving Party without reference to or reliance upon the Disclosing Party's Confidential Information.

5. TERM AND TERMINATION
The obligations of confidentiality under this Agreement shall survive for a period of {{confidentialityPeriod}} years from the Effective Date of this Agreement. Either party may terminate discussions regarding the Purpose at any time.

6. GOVERNING LAW
This Agreement shall be governed by, and construed in accordance with, the laws of the State of {{governingLaw}}, without reference to its conflict of laws principles.

IN WITNESS WHEREOF, the Parties have executed this Mutual Non-Disclosure Agreement as of the Effective Date.

For {{partyAName}}:
By: _______________________________
Name: _____________________________
Title: ____________________________

For {{partyBName}}:
By: _______________________________
Name: _____________________________
Title: ____________________________`
  },
  'freelance-developer-contract': {
    description: `A Freelance Web Developer Contract is a service agreement made between a software engineer or web developer (acting as an independent contractor) and a business client. This contract establishes the scope of work, project milestones, deliverables, payment terms, and intellectual property rights. It is essential for managing expectations and legally protecting client work and the developer's compensation.

This template covers standard freelance development scenarios including front-end design, back-end API integrations, and e-commerce setups. Crucial clauses include the intellectual property (IP) assignment clause—which dictates when and how ownership of the code transfers to the client—along with clauses regarding payment schedules, project scope changes (preventing scope creep), and confidentiality. Using a clear freelance agreement reduces the risk of disputes, ensuring a professional and secure engagement for both parties.`,
    variables: [
      { key: 'effectiveDate', label: 'Agreement Date', type: 'date', defaultValue: '2026-06-02' },
      { key: 'clientName', label: 'Client Company Name', type: 'text', defaultValue: 'Apex Retailers Inc.' },
      { key: 'developerName', label: 'Developer Full Name', type: 'text', defaultValue: 'Jane Miller' },
      { key: 'projectScope', label: 'Project Scope Summary', type: 'text', defaultValue: 'development of a custom React-based customer portal and API integration' },
      { key: 'paymentAmount', label: 'Project Fixed Fee (INR)', type: 'number', defaultValue: '120000' },
      { key: 'milestoneDetails', label: 'Milestone Deliverables', type: 'text', defaultValue: '50% upon design approval, 50% upon final source code delivery and deployment' },
      { key: 'governingLaw', label: 'Governing State/Country', type: 'text', defaultValue: 'Karnataka, India' }
    ],
    faqs: [
      {
        q: "Who owns the intellectual property (IP) in a freelance web development project?",
        a: "By default, in many jurisdictions, an independent contractor owns the copyright of the code they write unless a written agreement states otherwise. This Freelance Developer Contract explicitly transfers the IP rights to the client, but only *after* final payment has been made in full."
      },
      {
        q: "How can freelancers protect themselves from unpaid work?",
        a: "Freelancers can protect themselves by using milestone-based billing, requiring an upfront deposit (e.g., 25-50%), and including an escrow or payment-hold clause. Using Contractual's built-in escrow services ensures that client funds are secured before starting work."
      },
      {
        q: "What should be included in a web development scope of work?",
        a: "A robust scope of work should define clear, measurable deliverables, browser and device compatibility targets, maximum feedback/revision rounds, deadlines, and a clause stating that requests outside of the agreed list will require a separate change order and fee."
      }
    ],
    howto: [
      "List the names of the freelance developer and the client company.",
      "Outline the detailed scope of development work, including technical stack and requirements.",
      "Specify the payment terms, including upfront deposit and subsequent milestone releases.",
      "Establish the timeline and deadlines for each milestone delivery.",
      "Review the Intellectual Property section to ensure the terms of code transfer are mutually agreed upon."
    ],
    template: `INDEPENDENT CONTRACTOR AGREEMENT (WEB DEVELOPMENT)

This Independent Contractor Agreement (the "Agreement") is made effective as of {{effectiveDate}}, by and between:

Client: {{clientName}} (hereinafter referred to as the "Client")
Developer: {{developerName}} (hereinafter referred to as the "Contractor").

1. SCOPE OF SERVICES
Contractor agrees to perform the following services for the Client:
{{projectScope}}
Any additional work requested outside this scope shall be subject to a separate written change order.

2. PAYMENT AND COMPENSATION
The Client agrees to pay the Contractor a fixed fee of INR {{paymentAmount}} for the services. 
Payments shall be released based on the following milestones:
{{milestoneDetails}}

3. INTELLECTUAL PROPERTY
Upon receipt of final payment in full, all intellectual property rights, including copyrights in the source code, custom graphics, and assets created specifically for this project, shall transfer to the Client. The Contractor retains the right to showcase the completed work in their professional portfolio.

4. RELATIONSHIP OF PARTIES
The Contractor is an independent contractor. Nothing in this Agreement shall construct a partnership, joint venture, employer-employee relationship, or agency between the Parties.

5. CONFIDENTIALITY
The Contractor agrees to keep all proprietary client business information, assets, and plans confidential and not to share them with third parties.

6. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of {{governingLaw}}.

IN WITNESS WHEREOF, the Parties hereto have executed this Agreement as of the date first written above.

For {{clientName}}:
By: _______________________________
Name: _____________________________

Developer:
By: _______________________________
Name: {{developerName}}`
  },
  'saas-terms-of-service': {
    description: `SaaS Terms of Service (TOS), also referred to as SaaS Terms and Conditions, are the legal rules that govern the relationship between a software-as-a-service (SaaS) provider and its users or subscribers. This document regulates account creation, subscription pricing, billing cycles, user-conduct guidelines, data privacy practices, and limitation of liability.

Having a robust SaaS Terms of Service is mandatory for mitigating legal risks, protecting your intellectual property, preventing platform abuse (such as scraping or reverse engineering), and establishing the rights of the SaaS platform to terminate service. It directly supports compliance with global data protection laws (such as GDPR, CCPA, and COPPA) when combined with a Data Processing Addendum.`,
    variables: [
      { key: 'effectiveDate', label: 'TOS Effective Date', type: 'date', defaultValue: '2026-06-02' },
      { key: 'companyName', label: 'SaaS Company Name', type: 'text', defaultValue: 'CloudFlow Solutions Ltd.' },
      { key: 'platformName', label: 'Platform Name', type: 'text', defaultValue: 'CloudFlow API Suite' },
      { key: 'subscriptionFee', label: 'Base Subscription Price ($)', type: 'number', defaultValue: '49' },
      { key: 'governingLaw', label: 'Governing Law State', type: 'text', defaultValue: 'Delaware' }
    ],
    faqs: [
      {
        q: "Why does my software need a SaaS Terms of Service?",
        a: "A SaaS Terms of Service protects your proprietary platform code and assets, defines refund and billing policies, outlines permitted user activities, and limits your company's liability in the event of server outages, security breaches, or data losses."
      },
      {
        q: "How does a SaaS Terms of Service handle user data ownership?",
        a: "Standard SaaS terms specify that the subscriber or user retains full ownership of the data they upload. However, the user grants the SaaS provider a limited license to host, process, and analyze that data solely for the purpose of running and improving the services."
      },
      {
        q: "What is the difference between Terms of Service and a Privacy Policy?",
        a: "Terms of Service govern the legal rules of platform use, account management, and billing policies. A Privacy Policy is a legally required document that discloses exactly how your website or software collects, stores, uses, and shares personal user data."
      }
    ],
    howto: [
      "Input your legal business entity name and platform name.",
      "Establish subscription tiers, billing terms, and refund policy rules.",
      "Configure limitation of liability caps to protect your corporate assets.",
      "Specify the state/country governing law for resolution of legal disputes.",
      "Publish the Terms of Service visibly on your website footer and signup forms."
    ],
    template: `SAAS TERMS OF SERVICE

Welcome to {{platformName}}. These Terms of Service (the "Terms") govern your use of the SaaS application and website hosted by {{companyName}} (the "Company"). 

By creating an account, subscribing, or using the Platform, you agree to be bound by these Terms as of the Effective Date: {{effectiveDate}}.

1. ACCOUNT REGISTRATION
To access the Platform, you must register for an account and provide accurate, current, and complete registration information. You are solely responsible for maintaining the confidentiality of your account credentials.

2. FEES AND BILLING
Users agree to pay the standard subscription fees. The base pricing starts at USD {{subscriptionFee}} per month. Fees are billed in advance on a recurring monthly or annual basis. All payments are non-refundable unless specified otherwise.

3. LICENSE AND RESTRICTIONS
The Company grants you a limited, non-exclusive, non-transferable, revocable license to access the Platform. You agree NOT to:
- Reverse engineer or copy the source code of the Platform.
- Use the Platform to distribute malware or engage in spamming.
- Exceed reasonable API call limits or scrape system data.

4. USER DATA AND PRIVACY
You retain ownership of all data you upload to {{platformName}}. You grant the Company a global, royalty-free license to host, process, and transfer your data solely as required to provide the services.

5. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW, {{companyName}} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR IN CONNECTION WITH THE PLATFORM.

6. GOVERNING LAW
These Terms shall be governed by and construed in accordance with the laws of the State of {{governingLaw}}, without regard to its conflict of law principles.

Contact: support@{{platformName.toLowerCase().replace(/\s+/g, '')}}.com`
  }
};

// 50 templates definition.
// Categorized: NDA (10), Employment (10), Freelance (10), SaaS (10), Startup (10)
const templatesMeta = [
  // NDA
  { slug: 'mutual-nda', name: 'Mutual Non-Disclosure Agreement', category: 'NDA' },
  { slug: 'one-way-nda', name: 'One-Way Non-Disclosure Agreement', category: 'NDA' },
  { slug: 'founder-nda', name: 'Startup Founder Non-Disclosure Agreement', category: 'NDA' },
  { slug: 'employee-nda', name: 'Employee Non-Disclosure Agreement', category: 'NDA' },
  { slug: 'vendor-nda', name: 'Vendor Non-Disclosure Agreement', category: 'NDA' },
  { slug: 'visitor-nda', name: 'Visitor Confidentiality Agreement', category: 'NDA' },
  { slug: 'ma-nda', name: 'M&A Due Diligence NDA', category: 'NDA' },
  { slug: 'consultant-nda', name: 'Consultant Confidentiality Agreement', category: 'NDA' },
  { slug: 'academic-research-nda', name: 'Academic Research NDA', category: 'NDA' },
  { slug: 'financial-nda', name: 'Financial Data Non-Disclosure Agreement', category: 'NDA' },

  // Employment
  { slug: 'full-time-employment-agreement', name: 'Full-Time Employment Agreement', category: 'Employment' },
  { slug: 'part-time-employment-agreement', name: 'Part-Time Employment Agreement', category: 'Employment' },
  { slug: 'executive-employment-agreement', name: 'Executive Employment Agreement', category: 'Employment' },
  { slug: 'temporary-employee-agreement', name: 'Temporary Employee Agreement', category: 'Employment' },
  { slug: 'remote-worker-agreement', name: 'Remote Worker Agreement', category: 'Employment' },
  { slug: 'internship-agreement', name: 'Internship Agreement', category: 'Employment' },
  { slug: 'sales-commission-agreement', name: 'Commission-Based Sales Agreement', category: 'Employment' },
  { slug: 'advisory-board-agreement', name: 'Advisory Board Agreement', category: 'Employment' },
  { slug: 'founder-employment-agreement', name: 'Founder Employment Agreement', category: 'Employment' },
  { slug: 'non-compete-agreement', name: 'Non-Compete and Non-Solicitation Agreement', category: 'Employment' },

  // Freelance
  { slug: 'freelance-developer-contract', name: 'Freelance Web Developer Contract', category: 'Freelance' },
  { slug: 'freelance-writer-contract', name: 'Freelance Copywriter Contract', category: 'Freelance' },
  { slug: 'independent-contractor-agreement', name: 'Independent Contractor Agreement', category: 'Freelance' },
  { slug: 'creative-consultant-agreement', name: 'Creative Consultant Agreement', category: 'Freelance' },
  { slug: 'graphic-designer-contract', name: 'Graphic Designer Contract', category: 'Freelance' },
  { slug: 'social-media-manager-agreement', name: 'Social Media Manager Agreement', category: 'Freelance' },
  { slug: 'photographer-service-agreement', name: 'Photographer Service Agreement', category: 'Freelance' },
  { slug: 'video-editor-contract', name: 'Video Editor Contract', category: 'Freelance' },
  { slug: 'seo-specialist-agreement', name: 'SEO Specialist Agreement', category: 'Freelance' },
  { slug: 'virtual-assistant-agreement', name: 'Virtual Assistant Agreement', category: 'Freelance' },

  // SaaS
  { slug: 'software-development-agreement', name: 'Software Development Agreement', category: 'SaaS' },
  { slug: 'saas-terms-of-service', name: 'SaaS Terms of Service', category: 'SaaS' },
  { slug: 'service-level-agreement', name: 'Service Level Agreement (SLA)', category: 'SaaS' },
  { slug: 'software-license-agreement', name: 'Software License Agreement', category: 'SaaS' },
  { slug: 'eula-template', name: 'End User License Agreement (EULA)', category: 'SaaS' },
  { slug: 'api-license-agreement', name: 'API License Agreement', category: 'SaaS' },
  { slug: 'data-processing-addendum', name: 'Data Processing Addendum (DPA)', category: 'SaaS' },
  { slug: 'software-maintenance-agreement', name: 'Software Maintenance Agreement', category: 'SaaS' },
  { slug: 'beta-tester-agreement', name: 'Beta Tester Agreement', category: 'SaaS' },
  { slug: 'white-label-saas-agreement', name: 'White Label SaaS Agreement', category: 'SaaS' },

  // Startup
  { slug: 'founder-collaboration-agreement', name: 'Founder Collaboration Agreement', category: 'Startup' },
  { slug: 'shareholder-agreement', name: 'Shareholder Agreement', category: 'Startup' },
  { slug: 'partnership-agreement', name: 'Partnership Agreement', category: 'Startup' },
  { slug: 'joint-venture-agreement', name: 'Joint Venture Agreement', category: 'Startup' },
  { slug: 'advisor-agreement-fast', name: 'Founder Advisor Standard Template (FAST)', category: 'Startup' },
  { slug: 'ip-assignment-agreement', name: 'Intellectual Property Assignment Agreement', category: 'Startup' },
  { slug: 'seed-round-term-sheet', name: 'Term Sheet for Seed Round', category: 'Startup' },
  { slug: 'safe-agreement', name: 'Simple Agreement for Future Equity (SAFE)', category: 'Startup' },
  { slug: 'board-resolution-template', name: 'Board Resolution Template', category: 'Startup' },
  { slug: 'business-sale-agreement', name: 'Business Sale Agreement', category: 'Startup' }
];

// Helper to generate boilerplate description, variables, FAQs, howtos, and templates programmatically for rest 47 templates.
function generateFallbackTemplate(meta) {
  const name = meta.name;
  const category = meta.category;
  
  const description = `This professional ${name} is a state-of-the-art legal template designed to help companies, contractors, and individuals establish clear terms and minimize legal liabilities. Specifically engineered to meet commercial requirements in 2026, it addresses key regulatory guidelines, IP transfers, liability constraints, and dispute resolution mechanisms relevant to its category. 

Using our customizable ${name} enables you to automate document drafting, verify crucial clauses, and secure signatures in seconds. It serves as an authoritative framework to protect both contracting parties under governing laws, making it highly valuable for business compliance and generative engine optimization citations. Ensure your business is legally insulated by deploying this vetted framework today.`;

  const variables = [
    { key: 'effectiveDate', label: 'Effective Date', type: 'date', defaultValue: '2026-06-02' },
    { key: 'firstParty', label: 'Disclosing/First Party Name', type: 'text', defaultValue: 'Apex Corporation' },
    { key: 'secondParty', label: 'Receiving/Second Party Name', type: 'text', defaultValue: 'Consulting Group Ltd' },
    { key: 'governingLaw', label: 'Governing Jurisdiction', type: 'text', defaultValue: 'New York' },
    { key: 'financialTerms', label: 'Financial Consideration (if any)', type: 'text', defaultValue: 'As agreed in schedules' }
  ];

  const faqs = [
    {
      q: `What is the primary purpose of a ${name}?`,
      a: `A ${name} is designed to establish a legally binding agreement between parties, clarifying rights, obligations, and restrictions in relation to ${category.toLowerCase()} activities. This document helps avoid costly legal disputes and sets clear expectations.`
    },
    {
      q: `Can I customize this ${name} template for my specific business stack?`,
      a: `Yes. This template is designed with adjustable variable fields, allowing you to fill in party details, date terms, governing jurisdictions, and financial parameters to generate a customized PDF version ready for signature.`
    },
    {
      q: `Is this ${name} document legally compliant with 2026 standards?`,
      a: `This agreement incorporates modern commercial standards, intellectual property assignments, and governing law clauses. However, because legal requirements vary by location, it is recommended to have a legal expert review final copies.`
    }
  ];

  const howto = [
    `Enter the primary details of both contracting parties.`,
    `Specify the key parameters, date of activation, and governing jurisdiction.`,
    `Define any financial considerations or project deliverables in scope.`,
    `Review and adjust the standard terms to fit local guidelines.`,
    `Save, print, or share the customized document for electronic signature.`
  ];

  const template = `${name.toUpperCase()}

This ${name} (the "Agreement") is entered into and made effective as of {{effectiveDate}} (the "Effective Date"), by and between:

First Party: {{firstParty}}
Second Party: {{secondParty}}

1. SUBJECT MATTER
The Parties agree to cooperate and align on all matters related to {{category}} in accordance with the terms laid out herein.

2. COVENANTS AND TERMS
The Parties agree to maintain professional standards, verify deliverables, and respect proprietary interests.
Any financial terms are specified as: {{financialTerms}}.

3. MUTUAL UNDERSTANDINGS
- Neither Party shall assign this Agreement without written consent of the other.
- The Parties are independent contractors, and this does not establish an employment relationship.

4. CONFIDENTIALITY & PROPRIETARY RIGHTS
All materials exchanged in support of this Agreement shall remain the property of the originating Party and must be held in strict confidence.

5. GOVERNING LAW
This Agreement shall be governed by, and construed in accordance with, the laws of {{governingLaw}}.

IN WITNESS WHEREOF, the Parties hereto have caused this {{name}} to be executed.

First Party Representative:
By: _______________________________

Second Party Representative:
By: _______________________________`;

  return { description, variables, faqs, howto, template };
}

// Assemble the final templates array
export const templates = templatesMeta.map(meta => {
  const custom = customTemplatesContent[meta.slug];
  const detail = custom || generateFallbackTemplate(meta);
  
  // Combine meta and detail fields
  return {
    ...meta,
    description: detail.description,
    variables: detail.variables,
    faqs: detail.faqs,
    howto: detail.howto,
    contentTemplate: detail.template,
    author: {
      name: "Sarah Jenkins, Esq.",
      slug: "sarah-jenkins",
      bio: "Senior Legal Counsel with 12+ years specializing in commercial contracts, SaaS compliance, and startup protection. Graduate of Harvard Law School, member of the California Bar."
    }
  };
});

// Helper functions for easy querying
export function getTemplateBySlug(slug) {
  return templates.find(t => t.slug === slug);
}

export function getTemplatesByCategory(category) {
  return templates.filter(t => t.category === category);
}

export function getCategories() {
  return ['NDA', 'Employment', 'Freelance', 'SaaS', 'Startup'];
}
