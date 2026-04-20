-- DCLI Invoice Workflow — Config tables
-- Scope: DCLI-only. Replicate per vendor by copy-paste-rename.
-- Source: DCLI_Chassis_Expenses.xlsx → Data Validation sheet

begin;

-- ============================================================================
-- Payment status (4 values)
-- Split from the 18-value combined "Status" column in the workbook.
-- ============================================================================
create table if not exists dcli_payment_status (
  code          text primary key,
  label         text not null,
  sort_order    int  not null,
  active        boolean not null default true
);

insert into dcli_payment_status (code, label, sort_order) values
  ('UNPAID',     'Unpaid',     10),
  ('OK_TO_PAY',  'OK to Pay',  20),
  ('SCHEDULED',  'Scheduled',  30),
  ('PAID',       'Paid',       40)
on conflict (code) do nothing;

-- ============================================================================
-- Dispute status (11 values). All seeded active=true pending workflow decisions.
-- ============================================================================
create table if not exists dcli_dispute_status (
  code          text primary key,
  label         text not null,
  sort_order    int  not null,
  requires_action boolean not null default false,
  active        boolean not null default true
);

insert into dcli_dispute_status (code, label, sort_order, requires_action) values
  ('NONE',                    'None',                     10, false),
  ('NEED_TO_DISPUTE',         'Need to Dispute',          20, true),
  ('DISPUTE_PENDING',         'Dispute Pending',          30, false),
  ('DISPUTE_APPROVED',        'Dispute Approved',         40, false),
  ('DISPUTE_REJECTED',        'Dispute Rejected',         50, true),
  ('NEED_TO_EMAIL_AM',        'Need to Email AM',         60, true),
  ('EMAILED_AM',              'Emailed AM',               70, false),
  ('NEED_TO_EMAIL_CARRIER',   'Need to Email Carrier',    80, true),
  ('EMAILED_CARRIER',         'Emailed Carrier',          90, false),
  ('NEED_TO_EMAIL_TERMINAL',  'Need to Email Terminal',  100, true),
  ('EMAILED_TERMINAL',        'Emailed Terminal',        110, false)
on conflict (code) do nothing;

-- ============================================================================
-- Charge absorption category (8 values — from Data Validation)
-- ============================================================================
create table if not exists dcli_charge_absorption_category (
  id            bigserial primary key,
  name          text not null unique,
  active        boolean not null default true
);

insert into dcli_charge_absorption_category (name) values
  ('Carrier'),
  ('Customer'),
  ('EP'),
  ('Forrest Logistics'),
  ('Forrest Transportation'),
  ('Multiple'),
  ('SSL'),
  ('Terminal')
on conflict (name) do nothing;

-- ============================================================================
-- Charge absorption sub-category (17 values — from Data Validation)
-- Not linked to parent category yet; relationship may be one-to-many.
-- Leaving unlinked until workflow semantics are confirmed.
-- ============================================================================
create table if not exists dcli_charge_absorption_sub_category (
  id            bigserial primary key,
  name          text not null unique,
  category_id   bigint references dcli_charge_absorption_category(id),
  active        boolean not null default true
);

insert into dcli_charge_absorption_sub_category (name) values
  ('Customer Contract'),
  ('AM - No Billing'),
  ('AM - Overbilled'),
  ('AM - Underbilled'),
  ('Chassis Misuse'),
  ('Dispute Approved'),
  ('EP - Billed In Error'),
  ('Export/Import Issue'),
  ('LKQ - 1 day free / $35 rate'),
  ('Waived 3 days chassis'),
  ('Multiple'),
  ('Request'),
  ('Ross - $19 rate'),
  ('SCAC Misuse'),
  ('Unethical Conduct'),
  ('All In Rate'),
  ('Walmart - All In')
on conflict (name) do nothing;

-- ============================================================================
-- Customer (218 values from Data Validation sheet)
-- Name stored as-is from sheet; importer handles casing/matching with citext.
-- ============================================================================
create extension if not exists citext;

create table if not exists dcli_customer (
  id            bigserial primary key,
  name          citext not null unique,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

insert into dcli_customer (name) values
  ('Atlas Van Lines International'),('ABCompany'),('Aca Forwarding Ltd'),
  ('Air Tiger Express (USA) Inc'),('Amber Worldwide Logistics'),
  ('American Tire Distributors'),('Apex Maritime Co. (LAX), Inc.'),
  ('Apex Maritime Co. (SFO), Inc.'),('ArcBest'),('Arizona Tile LLC'),
  ('Ascent Global Logistics'),('Ascent Global Logistics - KC'),
  ('Ascent Global Logistics - OK'),('Ascent Global Logistics - TN'),
  ('Ascent Global Logistics - TX'),('Ashley Furniture Industries'),
  ('ASL Logistics Worldwide LLC'),('Atlas World Group International'),
  ('Audit Logistics LLC'),('Axima Logistics'),('Axlehire, Inc'),
  ('BCIBrands LLC'),('Bekins Commercial Installations'),('BMB Shipping'),
  ('Browman Freight Services Inc'),('Calcot Ltd'),('California Recyclers Inc.'),
  ('Carmichael International Service'),('Ceva Air & Ocean Canada Inc'),
  ('Ceva Air & Ocean Canada Inc – Richmond'),('CMA CGM'),
  ('Coastal Growers LLC'),('Coastal Pacific Food Distributors Inc'),
  ('Columbus Customhouse Brokers Ltd'),('Concord Global Trading, Inc'),
  ('Constellation Logistics LLC'),('Crocs Inc'),('Crocs Inc Demurrage'),
  ('Cutter & Buck Inc.'),('CV International, Inc.'),
  ('Demanko HCL Logistics Inc'),('DHL US Global'),('Dimerco Express'),
  ('Dimerco Express (USA) Corp - LA'),
  ('Dimerco Express (USA) Group - San Francisco'),('Dizpot LLC'),
  ('DSV Air & Sea'),('DSV International - Roads Division'),('Earth Pkg LLC'),
  ('Ecosphere Global Logistics LLC'),('Ever Reach Logistics Inc'),
  ('Flat World Supply Chain LLC'),('Flexport'),
  ('Forrest Logistics Customer Top'),('FR Meyer Logistics'),
  ('Freight Tec Management Group Inc.'),('Freightgator Logistics Inc'),
  ('Fresh American LLC Dba Annie Selke Co.'),('Funko, LLC'),
  ('Gal Group Inc'),('Garson & Shaw LLC'),('Geo. S.Bush & Co.'),
  ('Georgia-Pacific'),('Global Freight Solutions Inc'),
  ('Global Logistical Connections, Inc'),('Green World Recycling, Inc.'),
  ('Hapag-Lloyd (America), LLC'),('Henx USA LLC'),('Hey Dude Inc'),
  ('Highland Cabinetry Inc'),('Hospitality Freight Company LLC'),
  ('Imperative Logistics LLC'),('Infinite Rags Exports Inc'),
  ('Interdom LLC'),('Interfreight Logistics Co Ltd'),
  ('Interport Global Logistics'),('Jacobi Carbons, Inc'),
  ('James Farrell & Co'),('Janel Group (Torrance CA)'),
  ('Janel Group Inc.'),('JBS Usa Food Company'),
  ('Jess Smith & Sons Cotton, Inc'),('Jet-Speed Logistics (USA) LLC'),
  ('JF Hillebrand - EC (Non-NYNJ)'),('JF Hillebrand - EC (NYNJ)'),
  ('JF Hillebrand - WC'),('John S Connor'),('JSS Almonds'),
  ('Kamigumi USA Inc'),('Kamigumi USA Inc - Konica'),
  ('Keen & Able Logistics (USA)'),('Kerry Apex (Ord)'),('Kerry Apex NYC'),
  ('Kerry Apex PNW'),('Kerry Apex STL'),
  ('Kintetsu World Express (USA), Inc'),('Konica Minolta'),('Konica Vsb'),
  ('Konica Vsb Steam1'),('Konica Vsb Steam2'),('Kousa International LLC'),
  ('Kuehne + Nagel Inc.'),('KW Food Inc'),('Laudadio Polymers, Inc.'),
  ('Lightning Quick LLC'),('LKQ Corporation'),('Logfret Inc.'),
  ('Logistics Plus Inc'),('Lopa Corp'),
  ('Louis Dreyfus Company Holdings Inc.'),
  ('Luma International Forwarding Inc'),('Maersk'),
  ('Majestic Entertainment Partners, LLC'),
  ('Mallory Alexander International Logistics LLC'),
  ('Mare Blu Furniture Direct'),('Mascot International Logistics'),
  ('Masterpiece International'),('Mattel Sales Corporation'),
  ('Mediterranean Shipping Company, Inc. USA'),('Meow Logistics'),
  ('Meridian Nut Growers LLC'),('Mitsubishi Logistics - Konica'),
  ('Mitsubishi Logistics America Corporation'),('MOL Worldwide Logistics'),
  ('Morgan Shipping Lines'),('MTI Worldwide Logistics Corporation'),
  ('MTS Logistics Inc'),('Navia USA LLC'),('Newage Casting LP'),
  ('NFI Global LLC'),('Nippon Express USA, Inc.'),('NV Great Land Trading'),
  ('Nxtpoint Logistics'),('Odyssey Intermodal LLC'),
  ('OEC Freight (NY) Inc. Dba OEC Group'),('OEC Freight (NY), Inc'),
  ('OEC Group - Chicago'),('OEC Group - NW'),('OEC Group - Kansas City'),
  ('OEC Group - Maryland Heights'),('Olgin Efune Recycling Company'),
  ('Omni Logistics LLC'),('ONE - Ocean Network Express'),
  ('One Hundred 80 Degrees Design LLC'),('ONF Logistics'),
  ('Optimize Freight Solutions LLC'),('Our World Energy'),
  ('Pacific Asiana LLC'),('Pacific Road Logistics'),('Panda Logistics'),
  ('Port Air Express'),('Purelife Gloves, LLC'),('Rinchem'),
  ('River Valley Paper Co. LLC'),('Ross Stores  Non EDI'),
  ('Ross Stores, Inc.'),('Ross Stores, Inc (D-POE)'),('Rugsusa LLC'),
  ('Rule Logistics'),('SA Recycling LLC'),('Sae Worldtrans Logistics (USA)'),
  ('Sapphire Carriers Inc.'),('Savino DelBene'),('Scan Global Logistics'),
  ('ScanWell Logistics CHI Inc'),('Schryver Logistics USA Inc'),
  ('Seamates International Dba Seamates Intermodal Inc'),
  ('Service Shipping Inc.'),('Standard Textile Co., Inc.'),
  ('Sumisho Global Logistics'),('Supreme Almonds of California, Inc.'),
  ('Taiwan Express (USA), Inc'),('Taral Plastics'),
  ('Target Shipping Co, Inc'),('Tec Logistics (USA) Inc - NY Office'),
  ('Topocean Consolidation Service (Los Angeles) Inc'),
  ('Topocean Consolidation Service Inc - Trucking (Los Angeles)'),
  ('Traffic Tech Inc'),('Transco Shipping'),('Transmarine Cargo USA'),
  ('Treehouse California Almonds, LLC'),('Trinity Logistics'),
  ('Turn 14 Distribution'),('UKA Transportation'),('Unipac Continental'),
  ('Unipac Shipping - NY'),('Universal Cargo Management, Inc'),
  ('Universal Forrest Products Industries'),('UPS Auburn'),
  ('UPS CustomsBrokerage'),('UPS GreeNWorks Distribution Center'),
  ('UPS LABrokerage'),('UPS LAX Ocean Service Center-Export'),
  ('UPS Ocean Freight Services, Inc.'),('UPS Supply Chain Solutions'),
  ('UPS Supply Chain Solutions Hayward'),
  ('UPS Supply Chain Solutions-CustomsBrokerage'),
  ('UPS Supply Chain Solutions-Export'),
  ('UPS Supply Chain Solutions-Forest Park'),
  ('UPS Supply Chain Solutions-Ohio CustomsBrokerage'),('UPS-ATL'),
  ('US Cargo Line'),('US Pacific Shipping Corp'),
  ('Vector Global Logistics LLC'),('Vilkon N.A. Inc,'),('Wado Partners'),
  ('Walmart Stores'),('Wan Hai Lines (America) Ltd.'),('Wasserstrom Company'),
  ('Waste Management National Services Inc.'),('West Coast Transport'),
  ('Winfibre (U.S) Incorporated'),('World Wide Transportation Inc'),
  ('Worldlink Logistics Inc'),('Worldwide Logistic Partners, Inc.'),
  ('Yoyo Global Freight Us Inc'),('Yusen Logistics (Americas) Inc.'),
  ('Transgroup Express, LLC')
on conflict (name) do nothing;

-- ============================================================================
-- Account manager (43 values — from Data Validation sheet)
-- ============================================================================
create table if not exists dcli_account_manager (
  id            bigserial primary key,
  name          citext not null unique,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

insert into dcli_account_manager (name) values
  ('ATD'),('Alexander Kuznetsov'),('Anthony Fernandez'),('Areli Aguilar'),
  ('Brittany Charlton'),('Christie Stover'),('Crocs Team'),('Dante Wright'),
  ('Dylan Abraham'),('Ean Castillo'),('East Coast Ops'),('Franck Tone'),
  ('Funko'),('Graham Oman'),('Ion Cervinschi'),('Jackie Hefernan'),
  ('Jasim Sukhera'),('Kevin Plummer'),('Laureen Osborne'),('Lucas Tay'),
  ('Matthew Holtz'),('Matthew Jana'),('Melissa Oregon'),('Michael Hill'),
  ('Michael Lamorgese'),('Navi San'),('Nicholas Paddock'),('Parkes Quail'),
  ('Ross Team'),('Ross Shafter Exports'),('Ryan Leerssen'),('Sara Spencer'),
  ('Seth Castillo'),('Shane Miller'),('Stephanie Carl'),('Todd Hamilton'),
  ('Trent Gavelek'),('Tyler Snyder'),('Victoria King'),('Virginia Medinilla'),
  ('Walmart'),('Zach Johnston'),('Travis Jacobson')
on conflict (name) do nothing;

commit;
