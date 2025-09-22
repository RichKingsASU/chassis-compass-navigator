export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ccm_activity: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          due_date: string | null
          id: number
          invoice: string | null
          invoice_amount: number | null
          invoice_category: string | null
          invoice_date: string | null
          invoice_status: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          due_date?: string | null
          id?: number
          invoice?: string | null
          invoice_amount?: number | null
          invoice_category?: string | null
          invoice_date?: string | null
          invoice_status?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          due_date?: string | null
          id?: number
          invoice?: string | null
          invoice_amount?: number | null
          invoice_category?: string | null
          invoice_date?: string | null
          invoice_status?: string | null
        }
        Relationships: []
      }
      ccm_invoice: {
        Row: {
          created_at: string
          file_name: string | null
          file_path: string | null
          file_type: string | null
          id: string
          invoice_date: string
          invoice_number: string
          provider: string
          reason_for_dispute: string | null
          status: string | null
          tags: string[] | null
          total_amount_usd: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          provider?: string
          reason_for_dispute?: string | null
          status?: string | null
          tags?: string[] | null
          total_amount_usd: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          provider?: string
          reason_for_dispute?: string | null
          status?: string | null
          tags?: string[] | null
          total_amount_usd?: number
          updated_at?: string
        }
        Relationships: []
      }
      ccm_invoice_data: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          row_data: Json
          sheet_name: string
          validated: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          row_data: Json
          sheet_name: string
          validated?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          row_data?: Json
          sheet_name?: string
          validated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ccm_invoice_data_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "ccm_invoice"
            referencedColumns: ["id"]
          },
        ]
      }
      dcli_activity: {
        Row: {
          allotment_company_name: string | null
          asset_type: string | null
          bco_nvocc_name: string | null
          bco_nvocc_scac: string | null
          booking: string | null
          chassis: string | null
          container: string | null
          created_date: string | null
          date_in: string | null
          date_out: string | null
          days_out: number | null
          id: number
          license_plate: string | null
          location_in: string | null
          market: string | null
          motor_carrier_name: string | null
          motor_carrier_scac: string | null
          pick_up_location: string | null
          pool_contract: string | null
          product: string | null
          region: string | null
          remarks: string | null
          request_status: string | null
          reservation: string | null
          reservation_status: string | null
          serial_number: string | null
          ss_scac: string | null
          steamship_line_name: string | null
          steamship_line_scac: string | null
          street_turn_from_scac: string | null
          street_turn_request_date: string | null
          street_turn_to_scac: string | null
          vin: string | null
        }
        Insert: {
          allotment_company_name?: string | null
          asset_type?: string | null
          bco_nvocc_name?: string | null
          bco_nvocc_scac?: string | null
          booking?: string | null
          chassis?: string | null
          container?: string | null
          created_date?: string | null
          date_in?: string | null
          date_out?: string | null
          days_out?: number | null
          id?: number
          license_plate?: string | null
          location_in?: string | null
          market?: string | null
          motor_carrier_name?: string | null
          motor_carrier_scac?: string | null
          pick_up_location?: string | null
          pool_contract?: string | null
          product?: string | null
          region?: string | null
          remarks?: string | null
          request_status?: string | null
          reservation?: string | null
          reservation_status?: string | null
          serial_number?: string | null
          ss_scac?: string | null
          steamship_line_name?: string | null
          steamship_line_scac?: string | null
          street_turn_from_scac?: string | null
          street_turn_request_date?: string | null
          street_turn_to_scac?: string | null
          vin?: string | null
        }
        Update: {
          allotment_company_name?: string | null
          asset_type?: string | null
          bco_nvocc_name?: string | null
          bco_nvocc_scac?: string | null
          booking?: string | null
          chassis?: string | null
          container?: string | null
          created_date?: string | null
          date_in?: string | null
          date_out?: string | null
          days_out?: number | null
          id?: number
          license_plate?: string | null
          location_in?: string | null
          market?: string | null
          motor_carrier_name?: string | null
          motor_carrier_scac?: string | null
          pick_up_location?: string | null
          pool_contract?: string | null
          product?: string | null
          region?: string | null
          remarks?: string | null
          request_status?: string | null
          reservation?: string | null
          reservation_status?: string | null
          serial_number?: string | null
          ss_scac?: string | null
          steamship_line_name?: string | null
          steamship_line_scac?: string | null
          street_turn_from_scac?: string | null
          street_turn_request_date?: string | null
          street_turn_to_scac?: string | null
          vin?: string | null
        }
        Relationships: []
      }
      flexivan_activity: {
        Row: {
          age: number | null
          due_date: string | null
          id: number
          invoice: string | null
          invoice_amount: number | null
          invoice_date: string | null
          invoice_type: string | null
          month_date: string | null
          outstanding_balance: number | null
          paid: number | null
          status: string | null
        }
        Insert: {
          age?: number | null
          due_date?: string | null
          id?: number
          invoice?: string | null
          invoice_amount?: number | null
          invoice_date?: string | null
          invoice_type?: string | null
          month_date?: string | null
          outstanding_balance?: number | null
          paid?: number | null
          status?: string | null
        }
        Update: {
          age?: number | null
          due_date?: string | null
          id?: number
          invoice?: string | null
          invoice_amount?: number | null
          invoice_date?: string | null
          invoice_type?: string | null
          month_date?: string | null
          outstanding_balance?: number | null
          paid?: number | null
          status?: string | null
        }
        Relationships: []
      }
      "flexivan-dispute": {
        Row: {
          dispute_amount: number | null
          dispute_date: string | null
          dispute_id: string | null
          dispute_reason: string | null
          id: number
          invoice_amount: number | null
          invoice_date: string | null
          invoice_nbr: string | null
          status: string | null
        }
        Insert: {
          dispute_amount?: number | null
          dispute_date?: string | null
          dispute_id?: string | null
          dispute_reason?: string | null
          id?: number
          invoice_amount?: number | null
          invoice_date?: string | null
          invoice_nbr?: string | null
          status?: string | null
        }
        Update: {
          dispute_amount?: number | null
          dispute_date?: string | null
          dispute_id?: string | null
          dispute_reason?: string | null
          id?: number
          invoice_amount?: number | null
          invoice_date?: string | null
          invoice_nbr?: string | null
          status?: string | null
        }
        Relationships: []
      }
      "flexivan-invoices": {
        Row: {
          age: number | null
          due_date: string | null
          id: number
          invoice: string | null
          invoice_amount: string | null
          invoice_date: string | null
          invoice_type: string | null
          month_date: string | null
          outstanding_balance: number | null
          paid: number | null
          status: string | null
        }
        Insert: {
          age?: number | null
          due_date?: string | null
          id?: number
          invoice?: string | null
          invoice_amount?: string | null
          invoice_date?: string | null
          invoice_type?: string | null
          month_date?: string | null
          outstanding_balance?: number | null
          paid?: number | null
          status?: string | null
        }
        Update: {
          age?: number | null
          due_date?: string | null
          id?: number
          invoice?: string | null
          invoice_amount?: string | null
          invoice_date?: string | null
          invoice_type?: string | null
          month_date?: string | null
          outstanding_balance?: number | null
          paid?: number | null
          status?: string | null
        }
        Relationships: []
      }
      "flexivan-outstanding": {
        Row: {
          age: number | null
          due_date: string | null
          id: number
          invoice: string | null
          invoice_amount: number | null
          invoice_date: string | null
          invoice_type: string | null
          month_date: string | null
          outstanding_balance: number | null
          paid: number | null
        }
        Insert: {
          age?: number | null
          due_date?: string | null
          id?: number
          invoice?: string | null
          invoice_amount?: number | null
          invoice_date?: string | null
          invoice_type?: string | null
          month_date?: string | null
          outstanding_balance?: number | null
          paid?: number | null
        }
        Update: {
          age?: number | null
          due_date?: string | null
          id?: number
          invoice?: string | null
          invoice_amount?: number | null
          invoice_date?: string | null
          invoice_type?: string | null
          month_date?: string | null
          outstanding_balance?: number | null
          paid?: number | null
        }
        Relationships: []
      }
      "flexivan-payhistory": {
        Row: {
          amount: number | null
          id: number
          memo: string | null
          payment_method: string | null
          tranid: string | null
          transaction_date: string | null
        }
        Insert: {
          amount?: number | null
          id?: number
          memo?: string | null
          payment_method?: string | null
          tranid?: string | null
          transaction_date?: string | null
        }
        Update: {
          amount?: number | null
          id?: number
          memo?: string | null
          payment_method?: string | null
          tranid?: string | null
          transaction_date?: string | null
        }
        Relationships: []
      }
      mg_tms: {
        Row: {
          acct_mg_name: string | null
          actual_rc_date: string | null
          available_at_port_date: string | null
          carrier_invoice_charge: string | null
          carrier_invoice_date: string | null
          carrier_invoice_num: string | null
          carrier_name: string | null
          carrier_rate_charge: string | null
          carrier_scac_code: string | null
          carrier_total_accessorials_rate: string | null
          carrier_total_invoice_detention: string | null
          carrier_total_invoice_fuel: string | null
          carrier_total_invoice_linehaul: string | null
          carrier_total_invoice_other: string | null
          carrier_total_rate_detention: string | null
          carrier_total_rate_fuel: string | null
          carrier_total_rate_linehaul: string | null
          carrier_total_rate_other: string | null
          chassis_description: string | null
          chassis_number: string | null
          chassis_number_format: string | null
          chassis_type: string | null
          container_at_port: string | null
          container_number: string | null
          container_number_format: string | null
          container_type: string | null
          created_by: string | null
          created_date: string | null
          cust_invoice_charge: string | null
          cust_invoice_date: string | null
          cust_invoice_num: string | null
          cust_rate_charge: string | null
          cust_total_invoice_detention: string | null
          cust_total_invoice_fuel: string | null
          cust_total_invoice_linehaul: string | null
          cust_total_invoice_other: string | null
          cust_total_rate_detention: string | null
          cust_total_rate_fuel: string | null
          cust_total_rate_linehaul: string | null
          customer_account_number: string | null
          customer_invoice_requested_date: string | null
          customer_name: string | null
          customer_reference_number: string | null
          customer_total_accessorials_rate: string | null
          customer_total_invoice_accessorials: string | null
          cycle_create_tendered: string | null
          cycle_delivery_custinvreq: string | null
          cycle_delivery_pod: string | null
          cycle_delivery_rc: string | null
          cycle_pickup_delivery: string | null
          cycle_tendered_pickup: string | null
          delivery_actual_date: string | null
          delivery_addr_1: string | null
          delivery_addr_2: string | null
          delivery_appmt_end: string | null
          delivery_appmt_start: string | null
          delivery_city: string | null
          delivery_create_date: string | null
          delivery_loc_code: string | null
          delivery_loc_name: string | null
          delivery_region: string | null
          delivery_state: string | null
          delivery_zipcode: string | null
          departed_rail_date: string | null
          direct_nvo: string | null
          domestic_move: string | null
          dotnumber: string | null
          dropandpull: string | null
          empty_pickup_date: string | null
          entreprise_num: string | null
          future_actual_delivery: string | null
          future_custinvreqdate: string | null
          future_pod_date: string | null
          future_rc_date: string | null
          id: string | null
          isemptyatyard: string | null
          isemptycontainerpickup: string | null
          item_description: string | null
          last_free_date: string | null
          ld_num: string | null
          ld_num_format: string | null
          load_complexity: string | null
          masterbolkey: string | null
          mbl: string | null
          mbl_format: string | null
          mcnumber: string | null
          miles: string | null
          origin_code_region: string | null
          pickup_actual_date: string | null
          pickup_addr_1: string | null
          pickup_addr_2: string | null
          pickup_appmt_end: string | null
          pickup_appmt_start: string | null
          pickup_city: string | null
          pickup_loc_code: string | null
          pickup_loc_name: string | null
          pickup_region: string | null
          pickup_state: string | null
          pickup_zipcode: string | null
          pod_added_date: string | null
          pod_received: string | null
          pod_status: string | null
          quantity: string | null
          quantity_type: string | null
          return_empty_container_update_date: string | null
          returned_empty_container_create_date: string | null
          row_id: number
          sales_person: string | null
          service: string | null
          service_codes: string | null
          servicemode: string | null
          shipment_number: string | null
          shipment_reference_number: string | null
          shipmentid: string | null
          so_num: string | null
          so_num_format: string | null
          source_file_key: string | null
          status: string | null
          steamshipline: string | null
          syncentrydatetime: string | null
          tendered_date: string | null
          transport_type: string | null
          unbilledflag: string | null
          updated_by: string | null
          updated_date: string | null
          ups_shipment_number: string | null
          vessel_eta: string | null
          vessel_name: string | null
          weight: string | null
          zero_rev: string | null
        }
        Insert: {
          acct_mg_name?: string | null
          actual_rc_date?: string | null
          available_at_port_date?: string | null
          carrier_invoice_charge?: string | null
          carrier_invoice_date?: string | null
          carrier_invoice_num?: string | null
          carrier_name?: string | null
          carrier_rate_charge?: string | null
          carrier_scac_code?: string | null
          carrier_total_accessorials_rate?: string | null
          carrier_total_invoice_detention?: string | null
          carrier_total_invoice_fuel?: string | null
          carrier_total_invoice_linehaul?: string | null
          carrier_total_invoice_other?: string | null
          carrier_total_rate_detention?: string | null
          carrier_total_rate_fuel?: string | null
          carrier_total_rate_linehaul?: string | null
          carrier_total_rate_other?: string | null
          chassis_description?: string | null
          chassis_number?: string | null
          chassis_number_format?: string | null
          chassis_type?: string | null
          container_at_port?: string | null
          container_number?: string | null
          container_number_format?: string | null
          container_type?: string | null
          created_by?: string | null
          created_date?: string | null
          cust_invoice_charge?: string | null
          cust_invoice_date?: string | null
          cust_invoice_num?: string | null
          cust_rate_charge?: string | null
          cust_total_invoice_detention?: string | null
          cust_total_invoice_fuel?: string | null
          cust_total_invoice_linehaul?: string | null
          cust_total_invoice_other?: string | null
          cust_total_rate_detention?: string | null
          cust_total_rate_fuel?: string | null
          cust_total_rate_linehaul?: string | null
          customer_account_number?: string | null
          customer_invoice_requested_date?: string | null
          customer_name?: string | null
          customer_reference_number?: string | null
          customer_total_accessorials_rate?: string | null
          customer_total_invoice_accessorials?: string | null
          cycle_create_tendered?: string | null
          cycle_delivery_custinvreq?: string | null
          cycle_delivery_pod?: string | null
          cycle_delivery_rc?: string | null
          cycle_pickup_delivery?: string | null
          cycle_tendered_pickup?: string | null
          delivery_actual_date?: string | null
          delivery_addr_1?: string | null
          delivery_addr_2?: string | null
          delivery_appmt_end?: string | null
          delivery_appmt_start?: string | null
          delivery_city?: string | null
          delivery_create_date?: string | null
          delivery_loc_code?: string | null
          delivery_loc_name?: string | null
          delivery_region?: string | null
          delivery_state?: string | null
          delivery_zipcode?: string | null
          departed_rail_date?: string | null
          direct_nvo?: string | null
          domestic_move?: string | null
          dotnumber?: string | null
          dropandpull?: string | null
          empty_pickup_date?: string | null
          entreprise_num?: string | null
          future_actual_delivery?: string | null
          future_custinvreqdate?: string | null
          future_pod_date?: string | null
          future_rc_date?: string | null
          id?: string | null
          isemptyatyard?: string | null
          isemptycontainerpickup?: string | null
          item_description?: string | null
          last_free_date?: string | null
          ld_num?: string | null
          ld_num_format?: string | null
          load_complexity?: string | null
          masterbolkey?: string | null
          mbl?: string | null
          mbl_format?: string | null
          mcnumber?: string | null
          miles?: string | null
          origin_code_region?: string | null
          pickup_actual_date?: string | null
          pickup_addr_1?: string | null
          pickup_addr_2?: string | null
          pickup_appmt_end?: string | null
          pickup_appmt_start?: string | null
          pickup_city?: string | null
          pickup_loc_code?: string | null
          pickup_loc_name?: string | null
          pickup_region?: string | null
          pickup_state?: string | null
          pickup_zipcode?: string | null
          pod_added_date?: string | null
          pod_received?: string | null
          pod_status?: string | null
          quantity?: string | null
          quantity_type?: string | null
          return_empty_container_update_date?: string | null
          returned_empty_container_create_date?: string | null
          row_id?: number
          sales_person?: string | null
          service?: string | null
          service_codes?: string | null
          servicemode?: string | null
          shipment_number?: string | null
          shipment_reference_number?: string | null
          shipmentid?: string | null
          so_num?: string | null
          so_num_format?: string | null
          source_file_key?: string | null
          status?: string | null
          steamshipline?: string | null
          syncentrydatetime?: string | null
          tendered_date?: string | null
          transport_type?: string | null
          unbilledflag?: string | null
          updated_by?: string | null
          updated_date?: string | null
          ups_shipment_number?: string | null
          vessel_eta?: string | null
          vessel_name?: string | null
          weight?: string | null
          zero_rev?: string | null
        }
        Update: {
          acct_mg_name?: string | null
          actual_rc_date?: string | null
          available_at_port_date?: string | null
          carrier_invoice_charge?: string | null
          carrier_invoice_date?: string | null
          carrier_invoice_num?: string | null
          carrier_name?: string | null
          carrier_rate_charge?: string | null
          carrier_scac_code?: string | null
          carrier_total_accessorials_rate?: string | null
          carrier_total_invoice_detention?: string | null
          carrier_total_invoice_fuel?: string | null
          carrier_total_invoice_linehaul?: string | null
          carrier_total_invoice_other?: string | null
          carrier_total_rate_detention?: string | null
          carrier_total_rate_fuel?: string | null
          carrier_total_rate_linehaul?: string | null
          carrier_total_rate_other?: string | null
          chassis_description?: string | null
          chassis_number?: string | null
          chassis_number_format?: string | null
          chassis_type?: string | null
          container_at_port?: string | null
          container_number?: string | null
          container_number_format?: string | null
          container_type?: string | null
          created_by?: string | null
          created_date?: string | null
          cust_invoice_charge?: string | null
          cust_invoice_date?: string | null
          cust_invoice_num?: string | null
          cust_rate_charge?: string | null
          cust_total_invoice_detention?: string | null
          cust_total_invoice_fuel?: string | null
          cust_total_invoice_linehaul?: string | null
          cust_total_invoice_other?: string | null
          cust_total_rate_detention?: string | null
          cust_total_rate_fuel?: string | null
          cust_total_rate_linehaul?: string | null
          customer_account_number?: string | null
          customer_invoice_requested_date?: string | null
          customer_name?: string | null
          customer_reference_number?: string | null
          customer_total_accessorials_rate?: string | null
          customer_total_invoice_accessorials?: string | null
          cycle_create_tendered?: string | null
          cycle_delivery_custinvreq?: string | null
          cycle_delivery_pod?: string | null
          cycle_delivery_rc?: string | null
          cycle_pickup_delivery?: string | null
          cycle_tendered_pickup?: string | null
          delivery_actual_date?: string | null
          delivery_addr_1?: string | null
          delivery_addr_2?: string | null
          delivery_appmt_end?: string | null
          delivery_appmt_start?: string | null
          delivery_city?: string | null
          delivery_create_date?: string | null
          delivery_loc_code?: string | null
          delivery_loc_name?: string | null
          delivery_region?: string | null
          delivery_state?: string | null
          delivery_zipcode?: string | null
          departed_rail_date?: string | null
          direct_nvo?: string | null
          domestic_move?: string | null
          dotnumber?: string | null
          dropandpull?: string | null
          empty_pickup_date?: string | null
          entreprise_num?: string | null
          future_actual_delivery?: string | null
          future_custinvreqdate?: string | null
          future_pod_date?: string | null
          future_rc_date?: string | null
          id?: string | null
          isemptyatyard?: string | null
          isemptycontainerpickup?: string | null
          item_description?: string | null
          last_free_date?: string | null
          ld_num?: string | null
          ld_num_format?: string | null
          load_complexity?: string | null
          masterbolkey?: string | null
          mbl?: string | null
          mbl_format?: string | null
          mcnumber?: string | null
          miles?: string | null
          origin_code_region?: string | null
          pickup_actual_date?: string | null
          pickup_addr_1?: string | null
          pickup_addr_2?: string | null
          pickup_appmt_end?: string | null
          pickup_appmt_start?: string | null
          pickup_city?: string | null
          pickup_loc_code?: string | null
          pickup_loc_name?: string | null
          pickup_region?: string | null
          pickup_state?: string | null
          pickup_zipcode?: string | null
          pod_added_date?: string | null
          pod_received?: string | null
          pod_status?: string | null
          quantity?: string | null
          quantity_type?: string | null
          return_empty_container_update_date?: string | null
          returned_empty_container_create_date?: string | null
          row_id?: number
          sales_person?: string | null
          service?: string | null
          service_codes?: string | null
          servicemode?: string | null
          shipment_number?: string | null
          shipment_reference_number?: string | null
          shipmentid?: string | null
          so_num?: string | null
          so_num_format?: string | null
          source_file_key?: string | null
          status?: string | null
          steamshipline?: string | null
          syncentrydatetime?: string | null
          tendered_date?: string | null
          transport_type?: string | null
          unbilledflag?: string | null
          updated_by?: string | null
          updated_date?: string | null
          ups_shipment_number?: string | null
          vessel_eta?: string | null
          vessel_name?: string | null
          weight?: string | null
          zero_rev?: string | null
        }
        Relationships: []
      }
      scspa_activity: {
        Row: {
          bill_to_company: string | null
          bill_to_party: string | null
          booking_boln: string | null
          carrier: string | null
          chassis: string | null
          container: string | null
          cost: number | null
          end_time: string | null
          from: string | null
          id: number
          line: string | null
          pool: string | null
          start_time: string | null
          status: string | null
          to: string | null
          type: string | null
        }
        Insert: {
          bill_to_company?: string | null
          bill_to_party?: string | null
          booking_boln?: string | null
          carrier?: string | null
          chassis?: string | null
          container?: string | null
          cost?: number | null
          end_time?: string | null
          from?: string | null
          id?: number
          line?: string | null
          pool?: string | null
          start_time?: string | null
          status?: string | null
          to?: string | null
          type?: string | null
        }
        Update: {
          bill_to_company?: string | null
          bill_to_party?: string | null
          booking_boln?: string | null
          carrier?: string | null
          chassis?: string | null
          container?: string | null
          cost?: number | null
          end_time?: string | null
          from?: string | null
          id?: number
          line?: string | null
          pool?: string | null
          start_time?: string | null
          status?: string | null
          to?: string | null
          type?: string | null
        }
        Relationships: []
      }
      trac_customer_information: {
        Row: {
          account_number: string | null
          customer_id: string | null
          customer_name: string | null
          customer_number: string | null
          statement_date: string | null
        }
        Insert: {
          account_number?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_number?: string | null
          statement_date?: string | null
        }
        Update: {
          account_number?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_number?: string | null
          statement_date?: string | null
        }
        Relationships: []
      }
      trac_debtor_transactions: {
        Row: {
          amount_adjusted: number | null
          amount_applied: number | null
          amount_due_original: number | null
          amount_due_remaining: number | null
          class1: string | null
          creation_date: string | null
          cust_trx_type_id: string | null
          customer_id: string | null
          customer_site_use_id: string | null
          customer_trx_id: string | null
          due_date: string | null
          exchange_rate: number | null
          exchange_rate_type: string | null
          exchanged_invoice_amount: number | null
          invoice_amount: number | null
          invoice_amount_due_original: number | null
          invoice_currency_code: string | null
          payment_schedule_id: string | null
          status: string | null
          str_creation_date: string | null
          str_due_date: string | null
          strtrxdate: string | null
          term_id: string | null
          terms_sequence_number: string | null
          trx_date: string | null
          trx_number: string | null
        }
        Insert: {
          amount_adjusted?: number | null
          amount_applied?: number | null
          amount_due_original?: number | null
          amount_due_remaining?: number | null
          class1?: string | null
          creation_date?: string | null
          cust_trx_type_id?: string | null
          customer_id?: string | null
          customer_site_use_id?: string | null
          customer_trx_id?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          exchange_rate_type?: string | null
          exchanged_invoice_amount?: number | null
          invoice_amount?: number | null
          invoice_amount_due_original?: number | null
          invoice_currency_code?: string | null
          payment_schedule_id?: string | null
          status?: string | null
          str_creation_date?: string | null
          str_due_date?: string | null
          strtrxdate?: string | null
          term_id?: string | null
          terms_sequence_number?: string | null
          trx_date?: string | null
          trx_number?: string | null
        }
        Update: {
          amount_adjusted?: number | null
          amount_applied?: number | null
          amount_due_original?: number | null
          amount_due_remaining?: number | null
          class1?: string | null
          creation_date?: string | null
          cust_trx_type_id?: string | null
          customer_id?: string | null
          customer_site_use_id?: string | null
          customer_trx_id?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          exchange_rate_type?: string | null
          exchanged_invoice_amount?: number | null
          invoice_amount?: number | null
          invoice_amount_due_original?: number | null
          invoice_currency_code?: string | null
          payment_schedule_id?: string | null
          status?: string | null
          str_creation_date?: string | null
          str_due_date?: string | null
          strtrxdate?: string | null
          term_id?: string | null
          terms_sequence_number?: string | null
          trx_date?: string | null
          trx_number?: string | null
        }
        Relationships: []
      }
      trac_invoice_lines: {
        Row: {
          attribute_category: string | null
          attribute10: string | null
          attribute11: string | null
          attribute13: string | null
          attribute4: string | null
          attribute8: string | null
          currency_code: string | null
          customer_trx_id: string | null
          customer_trx_line_id: string | null
          extended_amount: number | null
          extended_amount_formatted: string | null
          interface_line_attribute1: string | null
          interface_line_attribute2: string | null
          interface_line_attribute3: string | null
          interface_line_attribute4: string | null
          interface_line_context: string | null
          item_description: string | null
          line_number: string | null
          quantity: number | null
          tax_exists_for_this_line: boolean | null
          unit_selling_price: number | null
          unit_selling_price_formatted: string | null
        }
        Insert: {
          attribute_category?: string | null
          attribute10?: string | null
          attribute11?: string | null
          attribute13?: string | null
          attribute4?: string | null
          attribute8?: string | null
          currency_code?: string | null
          customer_trx_id?: string | null
          customer_trx_line_id?: string | null
          extended_amount?: number | null
          extended_amount_formatted?: string | null
          interface_line_attribute1?: string | null
          interface_line_attribute2?: string | null
          interface_line_attribute3?: string | null
          interface_line_attribute4?: string | null
          interface_line_context?: string | null
          item_description?: string | null
          line_number?: string | null
          quantity?: number | null
          tax_exists_for_this_line?: boolean | null
          unit_selling_price?: number | null
          unit_selling_price_formatted?: string | null
        }
        Update: {
          attribute_category?: string | null
          attribute10?: string | null
          attribute11?: string | null
          attribute13?: string | null
          attribute4?: string | null
          attribute8?: string | null
          currency_code?: string | null
          customer_trx_id?: string | null
          customer_trx_line_id?: string | null
          extended_amount?: number | null
          extended_amount_formatted?: string | null
          interface_line_attribute1?: string | null
          interface_line_attribute2?: string | null
          interface_line_attribute3?: string | null
          interface_line_attribute4?: string | null
          interface_line_context?: string | null
          item_description?: string | null
          line_number?: string | null
          quantity?: number | null
          tax_exists_for_this_line?: boolean | null
          unit_selling_price?: number | null
          unit_selling_price_formatted?: string | null
        }
        Relationships: []
      }
      trac_invoices: {
        Row: {
          attribute_category: string | null
          attribute10: string | null
          attribute11: string | null
          attribute13: string | null
          attribute4: string | null
          attribute8: string | null
          currency_code: string | null
          customer_trx_id: number | null
          customer_trx_line_id: number | null
          extended_amount: number | null
          extended_amount_formatted: string | null
          interface_line_attribute1: string | null
          interface_line_attribute2: string | null
          interface_line_attribute3: string | null
          interface_line_attribute4: string | null
          interface_line_context: string | null
          item_description: string | null
          line_number: number | null
          quantity: number | null
          tax_exists_for_this_line: boolean | null
          unit_selling_price: number | null
          unit_selling_price_formatted: string | null
        }
        Insert: {
          attribute_category?: string | null
          attribute10?: string | null
          attribute11?: string | null
          attribute13?: string | null
          attribute4?: string | null
          attribute8?: string | null
          currency_code?: string | null
          customer_trx_id?: number | null
          customer_trx_line_id?: number | null
          extended_amount?: number | null
          extended_amount_formatted?: string | null
          interface_line_attribute1?: string | null
          interface_line_attribute2?: string | null
          interface_line_attribute3?: string | null
          interface_line_attribute4?: string | null
          interface_line_context?: string | null
          item_description?: string | null
          line_number?: number | null
          quantity?: number | null
          tax_exists_for_this_line?: boolean | null
          unit_selling_price?: number | null
          unit_selling_price_formatted?: string | null
        }
        Update: {
          attribute_category?: string | null
          attribute10?: string | null
          attribute11?: string | null
          attribute13?: string | null
          attribute4?: string | null
          attribute8?: string | null
          currency_code?: string | null
          customer_trx_id?: number | null
          customer_trx_line_id?: number | null
          extended_amount?: number | null
          extended_amount_formatted?: string | null
          interface_line_attribute1?: string | null
          interface_line_attribute2?: string | null
          interface_line_attribute3?: string | null
          interface_line_attribute4?: string | null
          interface_line_context?: string | null
          item_description?: string | null
          line_number?: number | null
          quantity?: number | null
          tax_exists_for_this_line?: boolean | null
          unit_selling_price?: number | null
          unit_selling_price_formatted?: string | null
        }
        Relationships: []
      }
      trac_receipts: {
        Row: {
          amount: number | null
          cash_receipt_id: string | null
          receipt_date: string | null
          receipt_number: string | null
        }
        Insert: {
          amount?: number | null
          cash_receipt_id?: string | null
          receipt_date?: string | null
          receipt_number?: string | null
        }
        Update: {
          amount?: number | null
          cash_receipt_id?: string | null
          receipt_date?: string | null
          receipt_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
