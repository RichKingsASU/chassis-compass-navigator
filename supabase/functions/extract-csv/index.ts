// File: supabase/functions/extract-csv/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parse } from 'https://esm.sh/papaparse@5'; // CSV parser

// Create a Supabase admin client to safely insert data
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    // 1. Get the file path from the webhook payload
    const payload = await req.json();
    const filePath = payload.record.name; // e.g., "mg/mg_tms_2p_part_02.csv"

    // Ignore non-CSV files or files not in the 'mg' folder
    if (!filePath || !filePath.startsWith('mg/') || !filePath.endsWith('.csv')) {
      return new Response(JSON.stringify({ message: "Not a target CSV, skipping." }), { status: 200 });
    }

    // 2. Get the public URL for the new file
    const { data: urlData, error: urlError } = supabaseAdmin
      .storage
      .from('tms') // This is your bucket name
      .getPublicUrl(filePath);

    if (urlError) throw urlError;

    // 3. Fetch the CSV file content
    const csvResponse = await fetch(urlData.publicUrl);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.statusText}`);
    }
    const csvText = await csvResponse.text();

    // 4. Parse the CSV data
    const { data: parsedData, errors: parseErrors } = parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseErrors.length > 0) {
      console.error("Parsing errors:", parseErrors);
      throw new Error("Failed to parse CSV data.");
    }

    // 5. Format data for insertion
    //    This block is auto-generated based on your CSV's columns and data types.
    const dataToInsert = parsedData.map((row: any) => ({
      "id": row['id'] ? parseInt(row['id'], 10) : null,
      "ld_num": row['ld_num'] ? row['ld_num'] : null,
      "ld_num_format": row['ld_num_format'] ? row['ld_num_format'] : null,
      "so_num": row['so_num'] ? row['so_num'] : null,
      "so_num_format": row['so_num_format'] ? row['so_num_format'] : null,
      "created_date": row['created_date'] ? row['created_date'] : null,
      "created_by": row['created_by'] ? row['created_by'] : null,
      "updated_date": row['updated_date'] ? row['updated_date'] : null,
      "updated_by": row['updated_by'] ? row['updated_by'] : null,
      "acct_mg_name": row['acct_mg_name'] ? row['acct_mg_name'] : null,
      "mbl": row['mbl'] ? row['mbl'] : null,
      "mbl_format": row['mbl_format'] ? row['mbl_format'] : null,
      "container_number": row['container_number'] ? row['container_number'] : null,
      "container_number_format": row['container_number_format'] ? row['container_number_format'] : null,
      "container_type": row['container_type'] ? row['container_type'] : null,
      "chassis_number": row['chassis_number'] ? row['chassis_number'] : null,
      "chassis_number_format": row['chassis_number_format'] ? row['chassis_number_format'] : null,
      "chassis_type": row['chassis_type'] ? row['chassis_type'] : null,
      "chassis_description": row['chassis_description'] ? row['chassis_description'] : null,
      "transport_type": row['transport_type'] ? row['transport_type'] : null,
      "status": row['status'] ? row['status'] : null,
      "zero_rev": row['zero_rev'] ? row['zero_rev'] : null,
      "miles": row['miles'] ? parseFloat(row['miles']) : null,
      "weight": row['weight'] ? parseFloat(row['weight']) : null,
      "quantity": row['quantity'] ? parseInt(row['quantity'], 10) : null,
      "quantity_type": row['quantity_type'] ? row['quantity_type'] : null,
      "direct_nvo": row['direct_nvo'] ? row['direct_nvo'] : null,
      "service": row['service'] ? row['service'] : null,
      "load_complexity": row['load_complexity'] ? row['load_complexity'] : null,
      "customer_name": row['customer_name'] ? row['customer_name'] : null,
      "customer_reference_number": row['customer_reference_number'] ? row['customer_reference_number'] : null,
      "entreprise_num": row['entreprise_num'] ? row['entreprise_num'] : null,
      "carrier_name": row['carrier_name'] ? row['carrier_name'] : null,
      "carrier_scac_code": row['carrier_scac_code'] ? row['carrier_scac_code'] : null,
      "tendered_date": row['tendered_date'] ? row['tendered_date'] : null,
      "pickup_loc_code": row['pickup_loc_code'] ? row['pickup_loc_code'] : null,
      "pickup_loc_name": row['pickup_loc_name'] ? row['pickup_loc_name'] : null,
      "pickup_addr_1": row['pickup_addr_1'] ? row['pickup_addr_1'] : null,
      "pickup_addr_2": row['pickup_addr_2'] ? row['pickup_addr_2'] : null,
      "pickup_city": row['pickup_city'] ? row['pickup_city'] : null,
      "pickup_state": row['pickup_state'] ? row['pickup_state'] : null,
      "pickup_zipcode": row['pickup_zipcode'] ? row['pickup_zipcode'] : null,
      "pickup_region": row['pickup_region'] ? row['pickup_region'] : null,
      "delivery_loc_code": row['delivery_loc_code'] ? row['delivery_loc_code'] : null,
      "delivery_loc_name": row['delivery_loc_name'] ? row['delivery_loc_name'] : null,
      "delivery_addr_1": row['delivery_addr_1'] ? row['delivery_addr_1'] : null,
      "delivery_addr_2": row['delivery_addr_2'] ? row['delivery_addr_2'] : null,
      "delivery_city": row['delivery_city'] ? row['delivery_city'] : null,
      "delivery_state": row['delivery_state'] ? row['delivery_state'] : null,
      "delivery_zipcode": row['delivery_zipcode'] ? row['delivery_zipcode'] : null,
      "delivery_region": row['delivery_region'] ? row['delivery_region'] : null,
      "pickup_appmt_start": row['pickup_appmt_start'] ? row['pickup_appmt_start'] : null,
      "pickup_appmt_end": row['pickup_appmt_end'] ? row['pickup_appmt_end'] : null,
      "pickup_actual_date": row['pickup_actual_date'] ? row['pickup_actual_date'] : null,
      "delivery_appmt_start": row['delivery_appmt_start'] ? row['delivery_appmt_start'] : null,
      "delivery_appmt_end": row['delivery_appmt_end'] ? row['delivery_appmt_end'] : null,
      "delivery_actual_date": row['delivery_actual_date'] ? row['delivery_actual_date'] : null,
      "delivery_create_date": row['delivery_create_date'] ? row['delivery_create_date'] : null,
      "pod_received": (row['pod_received'] === true || (row['pod_received'] && row['pod_received'].toLowerCase() === 'true')) ? true : false,
      "pod_added_date": row['pod_added_date'] ? row['pod_added_date'] : null,
      "pod_status": row['pod_status'] ? row['pod_status'] : null,
      "returned_empty_container_create_date": row['returned_empty_container_create_date'] ? row['returned_empty_container_create_date'] : null,
      "actual_rc_date": row['actual_rc_date'] ? row['actual_rc_date'] : null,
      "return_empty_container_update_date": row['return_empty_container_update_date'] ? row['return_empty_container_update_date'] : null,
      "customer_invoice_requested_date": row['customer_invoice_requested_date'] ? row['customer_invoice_requested_date'] : null,
      "cycle_create_tendered": row['cycle_create_tendered'] ? parseInt(row['cycle_create_tendered'], 10) : null,
      "cycle_tendered_pickup": row['cycle_tendered_pickup'] ? parseInt(row['cycle_tendered_pickup'], 10) : null,
      "cycle_pickup_delivery": row['cycle_pickup_delivery'] ? parseInt(row['cycle_pickup_delivery'], 10) : null,
      "cycle_delivery_pod": row['cycle_delivery_pod'] ? parseInt(row['cycle_delivery_pod'], 10) : null,
      "cycle_delivery_rc": row['cycle_delivery_rc'] ? parseInt(row['cycle_delivery_rc'], 10) : null,
      "cycle_delivery_custinvreq": row['cycle_delivery_custinvreq'] ? parseInt(row['cycle_delivery_custinvreq'], 10) : null,
      "future_actual_delivery": row['future_actual_delivery'] ? parseInt(row['future_actual_delivery'], 10) : null,
      "future_pod_date": row['future_pod_date'] ? parseInt(row['future_pod_date'], 10) : null,
      "future_rc_date": row['future_rc_date'] ? parseInt(row['future_rc_date'], 10) : null,
      "future_custinvreqdate": row['future_custinvreqdate'] ? parseInt(row['future_custinvreqdate'], 10) : null,
      "carrier_rate_charge": row['carrier_rate_charge'] ? parseFloat(row['carrier_rate_charge']) : null,
      "carrier_total_rate_detention": row['carrier_total_rate_detention'] ? parseFloat(row['carrier_total_rate_detention']) : null,
      "carrier_total_rate_fuel": row['carrier_total_rate_fuel'] ? parseFloat(row['carrier_total_rate_fuel']) : null,
      "carrier_total_rate_linehaul": row['carrier_total_rate_linehaul'] ? parseFloat(row['carrier_total_rate_linehaul']) : null,
      "carrier_total_invoice_detention": row['carrier_total_invoice_detention'] ? parseFloat(row['carrier_total_invoice_detention']) : null,
      "carrier_total_invoice_fuel": row['carrier_total_invoice_fuel'] ? parseFloat(row['carrier_total_invoice_fuel']) : null,
      "carrier_total_accessorials_rate": row['carrier_total_accessorials_rate'] ? parseFloat(row['carrier_total_accessorials_rate']) : null,
      "carrier_invoice_charge": row['carrier_invoice_charge'] ? parseFloat(row['carrier_invoice_charge']) : null,
      "carrier_invoice_num": row['carrier_invoice_num'] ? row['carrier_invoice_num'] : null,
      "carrier_invoice_date": row['carrier_invoice_date'] ? row['carrier_invoice_date'] : null,
      "cust_rate_charge": row['cust_rate_charge'] ? parseFloat(row['cust_rate_charge']) : null,
      "cust_total_rate_detention": row['cust_total_rate_detention'] ? parseFloat(row['cust_total_rate_detention']) : null,
      "cust_total_rate_fuel": row['cust_total_rate_fuel'] ? parseFloat(row['cust_total_rate_fuel']) : null,
      "cust_total_rate_linehaul": row['cust_total_rate_linehaul'] ? parseFloat(row['cust_total_rate_linehaul']) : null,
      "customer_total_accessorials_rate": row['customer_total_accessorials_rate'] ? parseFloat(row['customer_total_accessorials_rate']) : null,
      "cust_invoice_charge": row['cust_invoice_charge'] ? parseFloat(row['cust_invoice_charge']) : null,
      "cust_total_invoice_detention": row['cust_total_invoice_detention'] ? parseFloat(row['cust_total_invoice_detention']) : null,
      "cust_total_invoice_fuel": row['cust_total_invoice_fuel'] ? parseFloat(row['cust_total_invoice_fuel']) : null,
      "cust_total_invoice_linehaul": row['cust_total_invoice_linehaul'] ? parseFloat(row['cust_total_invoice_linehaul']) : null,
      "customer_total_invoice_accessorials": row['customer_total_invoice_accessorials'] ? parseFloat(row['customer_total_invoice_accessorials']) : null,
      "cust_invoice_num": row['cust_invoice_num'] ? row['cust_invoice_num'] : null,
      "cust_invoice_date": row['cust_invoice_date'] ? row['cust_invoice_date'] : null,
      "steamshipline": row['steamshipline'] ? row['steamshipline'] : null,
      "shipmentid": row['shipmentid'] ? row['shipmentid'] : null,
      "shipment_number": row['shipment_number'] ? row['shipment_number'] : null,
      "shipment_reference_number": row['shipment_reference_number'] ? row['shipment_reference_number'] : null,
      "vessel_name": row['vessel_name'] ? row['vessel_name'] : null,
      "vessel_eta": row['vessel_eta'] ? row['vessel_eta'] : null,
      "carrier_total_rate_other": row['carrier_total_rate_other'] ? parseFloat(row['carrier_total_rate_other']) : null,
      "carrier_total_invoice_linehaul": row['carrier_total_invoice_linehaul'] ? parseFloat(row['carrier_total_invoice_linehaul']) : null,
      "carrier_total_invoice_other": row['carrier_total_invoice_other'] ? parseFloat(row['carrier_total_invoice_other']) : null,
      "cust_total_invoice_other": row['cust_total_invoice_other'] ? parseFloat(row['cust_total_invoice_other']) : null,
      "masterbolkey": row['masterbolkey'] ? parseInt(row['masterbolkey'], 10) : null,
      "syncentrydatetime": row['syncentrydatetime'] ? row['syncentrydatetime'] : null,
      "source_file_key": row['source_file_key'] ? parseInt(row['source_file_key'], 10) : null,
      "item_description": row['item_description'] ? row['item_description'] : null,
      "dotnumber": row['dotnumber'] ? parseFloat(row['dotnumber']) : null,
      "mcnumber": row['mcnumber'] ? parseFloat(row['mcnumber']) : null,
      "servicemode": row['servicemode'] ? row['servicemode'] : null,
      "unbilledflag": row['unbilledflag'] ? row['unbilledflag'] : null,
      "dropandpull": row['dropandpull'] ? row['dropandpull'] : null,
      "service_codes": row['service_codes'] ? row['service_codes'] : null,
      "customer_account_number": row['customer_account_number'] ? row['customer_account_number'] : null,
      "isemptyatyard": row['isemptyatyard'] ? row['isemptyatyard'] : null,
      "isemptycontainerpickup": row['isemptycontainerpickup'] ? parseFloat(row['isemptycontainerpickup']) : null,
      "ups_shipment_number": row['ups_shipment_number'] ? row['ups_shipment_number'] : null,
      "last_free_date": row['last_free_date'] ? row['last_free_date'] : null,
      "departed_rail_date": row['departed_rail_date'] ? parseFloat(row['departed_rail_date']) : null,
      "available_at_port_date": row['available_at_port_date'] ? row['available_at_port_date'] : null,
      "container_at_port": row['container_at_port'] ? row['container_at_port'] : null,
      "empty_pickup_date": row['empty_pickup_date'] ? row['empty_pickup_date'] : null,
      "sales_person": row['sales_person'] ? row['sales_person'] : null,
      "origin_code_region": row['origin_code_region'] ? row['origin_code_region'] : null,
      "domestic_move": row['domestic_move'] ? parseFloat(row['domestic_move']) : null,
      source_file: filePath // Tracks the source file
    }));

    if (dataToInsert.length === 0) {
      return new Response(JSON.stringify({ message: "CSV was empty, nothing to insert." }), { status: 200 });
    }

    // 6. Insert the data into your table
    const { error: insertError } = await supabaseAdmin
      .from('mg_tms_data') // This is your table name from Step 1
      .insert(dataToInsert);

    if (insertError) throw insertError;

    // 7. Return a success response
    return new Response(JSON.stringify({ message: `Successfully inserted ${dataToInsert.length} rows.` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error processing CSV:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});