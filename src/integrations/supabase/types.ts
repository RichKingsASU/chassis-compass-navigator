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
      anytrek_status: {
        Row: {
          address: string | null
          Country: string | null
          "Device Id": string | null
          "Driving Direction": string | null
          "Driving Status": string | null
          "Dwell Time": string | null
          "Enter Time(US/Pacific)": string | null
          Group: string | null
          Landmark: string | null
          "Last Location(UTC)": string | null
          Lat: string | null
          Lng: string | null
          "Speed(mp/h)": string | null
          "state/province": string | null
          Vehicle: string | null
        }
        Insert: {
          address?: string | null
          Country?: string | null
          "Device Id"?: string | null
          "Driving Direction"?: string | null
          "Driving Status"?: string | null
          "Dwell Time"?: string | null
          "Enter Time(US/Pacific)"?: string | null
          Group?: string | null
          Landmark?: string | null
          "Last Location(UTC)"?: string | null
          Lat?: string | null
          Lng?: string | null
          "Speed(mp/h)"?: string | null
          "state/province"?: string | null
          Vehicle?: string | null
        }
        Update: {
          address?: string | null
          Country?: string | null
          "Device Id"?: string | null
          "Driving Direction"?: string | null
          "Driving Status"?: string | null
          "Dwell Time"?: string | null
          "Enter Time(US/Pacific)"?: string | null
          Group?: string | null
          Landmark?: string | null
          "Last Location(UTC)"?: string | null
          Lat?: string | null
          Lng?: string | null
          "Speed(mp/h)"?: string | null
          "state/province"?: string | null
          Vehicle?: string | null
        }
        Relationships: []
      }
      ccm_invoice: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_path: string | null
          file_type: string | null
          id: string
          invoice_date: string
          invoice_number: string
          provider: string | null
          reason_for_dispute: string | null
          status: string | null
          tags: string[] | null
          total_amount_usd: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          provider?: string | null
          reason_for_dispute?: string | null
          status?: string | null
          tags?: string[] | null
          total_amount_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          provider?: string | null
          reason_for_dispute?: string | null
          status?: string | null
          tags?: string[] | null
          total_amount_usd?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ccm_invoice_data: {
        Row: {
          created_at: string | null
          id: number
          invoice_id: string | null
          row_data: Json | null
          sheet_name: string | null
          validated: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          invoice_id?: string | null
          row_data?: Json | null
          sheet_name?: string | null
          validated?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: number
          invoice_id?: string | null
          row_data?: Json | null
          sheet_name?: string | null
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
      chassis_master: {
        Row: {
          charge_code_mg: string | null
          chassis_category: string | null
          chassis_status: string | null
          description: string | null
          forrest_chassis_type: string | null
          forrest_chz_id: string
          forrest_off_hire_date: string | null
          forrest_on_hire_date: string | null
          manufacturer: string | null
          model_year: number | null
          month_acquired: string | null
          month_off_hired: string | null
          notes: string | null
          old_chz_id: string | null
          original_stated_value: number | null
          plate_number: string | null
          plate_state: string | null
          region: string | null
          serial_number: string | null
          tare_weight: string | null
          week_acquired: string | null
          week_off_hired: string | null
        }
        Insert: {
          charge_code_mg?: string | null
          chassis_category?: string | null
          chassis_status?: string | null
          description?: string | null
          forrest_chassis_type?: string | null
          forrest_chz_id: string
          forrest_off_hire_date?: string | null
          forrest_on_hire_date?: string | null
          manufacturer?: string | null
          model_year?: number | null
          month_acquired?: string | null
          month_off_hired?: string | null
          notes?: string | null
          old_chz_id?: string | null
          original_stated_value?: number | null
          plate_number?: string | null
          plate_state?: string | null
          region?: string | null
          serial_number?: string | null
          tare_weight?: string | null
          week_acquired?: string | null
          week_off_hired?: string | null
        }
        Update: {
          charge_code_mg?: string | null
          chassis_category?: string | null
          chassis_status?: string | null
          description?: string | null
          forrest_chassis_type?: string | null
          forrest_chz_id?: string
          forrest_off_hire_date?: string | null
          forrest_on_hire_date?: string | null
          manufacturer?: string | null
          model_year?: number | null
          month_acquired?: string | null
          month_off_hired?: string | null
          notes?: string | null
          old_chz_id?: string | null
          original_stated_value?: number | null
          plate_number?: string | null
          plate_state?: string | null
          region?: string | null
          serial_number?: string | null
          tare_weight?: string | null
          week_acquired?: string | null
          week_off_hired?: string | null
        }
        Relationships: []
      }
      dcli_invoice_raw: {
        Row: {
          bill_end_date: string | null
          bill_start_date: string | null
          billing_date: string | null
          billing_terms: string | null
          charge_description: string | null
          chassis: string | null
          corporate_account: string | null
          corporate_name: string | null
          created_at: string | null
          customer_name: string | null
          customer_number: string | null
          due_date: string | null
          grand_total: number | null
          haulage_type: string | null
          id: number
          in_gate_fees: number | null
          invoice_id: string | null
          invoice_number: string | null
          line_index: number | null
          ocean_carrier_scac: string | null
          off_hire_bol: string | null
          off_hire_booking_no: string | null
          off_hire_container: string | null
          off_hire_date: string | null
          off_hire_location: string | null
          off_hire_mc_scac: string | null
          off_hire_partner_code: string | null
          off_hire_status: string | null
          on_hire_area: string | null
          on_hire_bol: string | null
          on_hire_booking_no: string | null
          on_hire_container: string | null
          on_hire_date: string | null
          on_hire_location: string | null
          on_hire_mc_scac: string | null
          on_hire_partner_code: string | null
          on_hire_status: string | null
          out_gate_fees: number | null
          pool_contract: string | null
          raw: Json | null
          subtotal: number | null
          summary_invoice_number: string | null
          tax_amount: number | null
          tax_rate_percent: number | null
          tier_1_days: number | null
          tier_1_free_days: number | null
          tier_1_rate: number | null
          tier_1_subtotal: number | null
          tier_2_days: number | null
          tier_2_free_days: number | null
          tier_2_rate: number | null
          tier_2_subtotal: number | null
          tier_3_days: number | null
          tier_3_free_days: number | null
          tier_3_rate: number | null
          tier_3_subtotal: number | null
          total_fees: number | null
        }
        Insert: {
          bill_end_date?: string | null
          bill_start_date?: string | null
          billing_date?: string | null
          billing_terms?: string | null
          charge_description?: string | null
          chassis?: string | null
          corporate_account?: string | null
          corporate_name?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_number?: string | null
          due_date?: string | null
          grand_total?: number | null
          haulage_type?: string | null
          id?: never
          in_gate_fees?: number | null
          invoice_id?: string | null
          invoice_number?: string | null
          line_index?: number | null
          ocean_carrier_scac?: string | null
          off_hire_bol?: string | null
          off_hire_booking_no?: string | null
          off_hire_container?: string | null
          off_hire_date?: string | null
          off_hire_location?: string | null
          off_hire_mc_scac?: string | null
          off_hire_partner_code?: string | null
          off_hire_status?: string | null
          on_hire_area?: string | null
          on_hire_bol?: string | null
          on_hire_booking_no?: string | null
          on_hire_container?: string | null
          on_hire_date?: string | null
          on_hire_location?: string | null
          on_hire_mc_scac?: string | null
          on_hire_partner_code?: string | null
          on_hire_status?: string | null
          out_gate_fees?: number | null
          pool_contract?: string | null
          raw?: Json | null
          subtotal?: number | null
          summary_invoice_number?: string | null
          tax_amount?: number | null
          tax_rate_percent?: number | null
          tier_1_days?: number | null
          tier_1_free_days?: number | null
          tier_1_rate?: number | null
          tier_1_subtotal?: number | null
          tier_2_days?: number | null
          tier_2_free_days?: number | null
          tier_2_rate?: number | null
          tier_2_subtotal?: number | null
          tier_3_days?: number | null
          tier_3_free_days?: number | null
          tier_3_rate?: number | null
          tier_3_subtotal?: number | null
          total_fees?: number | null
        }
        Update: {
          bill_end_date?: string | null
          bill_start_date?: string | null
          billing_date?: string | null
          billing_terms?: string | null
          charge_description?: string | null
          chassis?: string | null
          corporate_account?: string | null
          corporate_name?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_number?: string | null
          due_date?: string | null
          grand_total?: number | null
          haulage_type?: string | null
          id?: never
          in_gate_fees?: number | null
          invoice_id?: string | null
          invoice_number?: string | null
          line_index?: number | null
          ocean_carrier_scac?: string | null
          off_hire_bol?: string | null
          off_hire_booking_no?: string | null
          off_hire_container?: string | null
          off_hire_date?: string | null
          off_hire_location?: string | null
          off_hire_mc_scac?: string | null
          off_hire_partner_code?: string | null
          off_hire_status?: string | null
          on_hire_area?: string | null
          on_hire_bol?: string | null
          on_hire_booking_no?: string | null
          on_hire_container?: string | null
          on_hire_date?: string | null
          on_hire_location?: string | null
          on_hire_mc_scac?: string | null
          on_hire_partner_code?: string | null
          on_hire_status?: string | null
          out_gate_fees?: number | null
          pool_contract?: string | null
          raw?: Json | null
          subtotal?: number | null
          summary_invoice_number?: string | null
          tax_amount?: number | null
          tax_rate_percent?: number | null
          tier_1_days?: number | null
          tier_1_free_days?: number | null
          tier_1_rate?: number | null
          tier_1_subtotal?: number | null
          tier_2_days?: number | null
          tier_2_free_days?: number | null
          tier_2_rate?: number | null
          tier_2_subtotal?: number | null
          tier_3_days?: number | null
          tier_3_free_days?: number | null
          tier_3_rate?: number | null
          tier_3_subtotal?: number | null
          total_fees?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dcli_invoice_raw_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_anytrek_log: {
        Row: {
          address: string | null
          Country: string | null
          "Device Id": string | null
          "Driving Direction": string | null
          "Driving Status": string | null
          "Dwell Time": string | null
          "Enter Time(US/Pacific)": string | null
          Group: string | null
          Landmark: string | null
          "Last Location(UTC)": string | null
          Lat: string | null
          Lng: string | null
          "Speed(mp/h)": string | null
          "state/province": string | null
          Vehicle: string | null
        }
        Insert: {
          address?: string | null
          Country?: string | null
          "Device Id"?: string | null
          "Driving Direction"?: string | null
          "Driving Status"?: string | null
          "Dwell Time"?: string | null
          "Enter Time(US/Pacific)"?: string | null
          Group?: string | null
          Landmark?: string | null
          "Last Location(UTC)"?: string | null
          Lat?: string | null
          Lng?: string | null
          "Speed(mp/h)"?: string | null
          "state/province"?: string | null
          Vehicle?: string | null
        }
        Update: {
          address?: string | null
          Country?: string | null
          "Device Id"?: string | null
          "Driving Direction"?: string | null
          "Driving Status"?: string | null
          "Dwell Time"?: string | null
          "Enter Time(US/Pacific)"?: string | null
          Group?: string | null
          Landmark?: string | null
          "Last Location(UTC)"?: string | null
          Lat?: string | null
          Lng?: string | null
          "Speed(mp/h)"?: string | null
          "state/province"?: string | null
          Vehicle?: string | null
        }
        Relationships: []
      }
      ingest_event_log: {
        Row: {
          bucket_id: string
          error: string | null
          http_status: number | null
          id: number
          job_id: number | null
          name: string
          op: string
          size_bytes: number | null
          ts: string
        }
        Insert: {
          bucket_id: string
          error?: string | null
          http_status?: number | null
          id?: number
          job_id?: number | null
          name: string
          op: string
          size_bytes?: number | null
          ts?: string
        }
        Update: {
          bucket_id?: string
          error?: string | null
          http_status?: number | null
          id?: number
          job_id?: number | null
          name?: string
          op?: string
          size_bytes?: number | null
          ts?: string
        }
        Relationships: []
      }
      ingest_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: number
          invoice_id: string | null
          message: string | null
          meta: Json | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: never
          invoice_id?: string | null
          message?: string | null
          meta?: Json | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: never
          invoice_id?: string | null
          message?: string | null
          meta?: Json | null
        }
        Relationships: []
      }
      ingest_files: {
        Row: {
          bucket_id: string
          etag: string | null
          object_name: string
          processed_at: string
        }
        Insert: {
          bucket_id: string
          etag?: string | null
          object_name: string
          processed_at?: string
        }
        Update: {
          bucket_id?: string
          etag?: string | null
          object_name?: string
          processed_at?: string
        }
        Relationships: []
      }
      invoice_line_embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: number
          invoice_id: string | null
          line_id: number | null
          vendor_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          invoice_id?: string | null
          line_id?: number | null
          vendor_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          invoice_id?: string | null
          line_id?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_embeddings_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_embeddings_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "invoice_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_embeddings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_matches: {
        Row: {
          acct_mg_name: string | null
          created_at: string | null
          customer_name: string | null
          id: number
          ld_num: string | null
          line_id: number | null
          match_status: string | null
          matched_on: string | null
          so_num: string | null
        }
        Insert: {
          acct_mg_name?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: never
          ld_num?: string | null
          line_id?: number | null
          match_status?: string | null
          matched_on?: string | null
          so_num?: string | null
        }
        Update: {
          acct_mg_name?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: never
          ld_num?: string | null
          line_id?: number | null
          match_status?: string | null
          matched_on?: string | null
          so_num?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_matches_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "invoice_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          bill_end: string | null
          bill_start: string | null
          billed_customer: string | null
          chassis_id: string | null
          container_id: string | null
          id: number
          ig_location: string | null
          invoice_id: string | null
          line_number: string | null
          og_location: string | null
          pool: string | null
          rate: number | null
          raw: Json | null
          total: number | null
          trucker_scac: string | null
          use_days: number | null
        }
        Insert: {
          bill_end?: string | null
          bill_start?: string | null
          billed_customer?: string | null
          chassis_id?: string | null
          container_id?: string | null
          id?: never
          ig_location?: string | null
          invoice_id?: string | null
          line_number?: string | null
          og_location?: string | null
          pool?: string | null
          rate?: number | null
          raw?: Json | null
          total?: number | null
          trucker_scac?: string | null
          use_days?: number | null
        }
        Update: {
          bill_end?: string | null
          bill_start?: string | null
          billed_customer?: string | null
          chassis_id?: string | null
          container_id?: string | null
          id?: never
          ig_location?: string | null
          invoice_id?: string | null
          line_number?: string | null
          og_location?: string | null
          pool?: string | null
          rate?: number | null
          raw?: Json | null
          total?: number | null
          trucker_scac?: string | null
          use_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          due_date: string | null
          error_text: string | null
          id: string
          invoice_date: string | null
          invoice_number: string
          line_count: number | null
          period_end: string | null
          period_start: string | null
          source_mime: string | null
          source_path: string | null
          status: string | null
          vendor_id: string | null
        }
        Insert: {
          amount_due?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          error_text?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number: string
          line_count?: number | null
          period_end?: string | null
          period_start?: string | null
          source_mime?: string | null
          source_path?: string | null
          status?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount_due?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          error_text?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          line_count?: number | null
          period_end?: string | null
          period_start?: string | null
          source_mime?: string | null
          source_path?: string | null
          status?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_details: {
        Row: {
          anytrek_unit_number: string | null
          contract_number: string | null
          contract_status: string | null
          current_rate_per_day: number | null
          date_last_contract_rcvd: string | null
          extended_end_date: string | null
          extended_gps_rate_per_day: number | null
          extended_lease_rate_per_day: number | null
          extended_lease_term: string | null
          extended_start_date: string | null
          extended_total_per_day: number | null
          forrest_chz_id: string | null
          gps_provider: string | null
          hard_gps_number: string | null
          initial_gps_rate_per_day: number | null
          initial_lease_end_date: string | null
          initial_lease_rate_per_day: number | null
          initial_lease_start_date: string | null
          initial_lease_term: string | null
          initial_total_per_day: number | null
          lease_id: number
          lessor: string | null
          pick_up_handling_fee: number | null
          pick_up_location: string | null
          return_handling_fee: number | null
        }
        Insert: {
          anytrek_unit_number?: string | null
          contract_number?: string | null
          contract_status?: string | null
          current_rate_per_day?: number | null
          date_last_contract_rcvd?: string | null
          extended_end_date?: string | null
          extended_gps_rate_per_day?: number | null
          extended_lease_rate_per_day?: number | null
          extended_lease_term?: string | null
          extended_start_date?: string | null
          extended_total_per_day?: number | null
          forrest_chz_id?: string | null
          gps_provider?: string | null
          hard_gps_number?: string | null
          initial_gps_rate_per_day?: number | null
          initial_lease_end_date?: string | null
          initial_lease_rate_per_day?: number | null
          initial_lease_start_date?: string | null
          initial_lease_term?: string | null
          initial_total_per_day?: number | null
          lease_id?: number
          lessor?: string | null
          pick_up_handling_fee?: number | null
          pick_up_location?: string | null
          return_handling_fee?: number | null
        }
        Update: {
          anytrek_unit_number?: string | null
          contract_number?: string | null
          contract_status?: string | null
          current_rate_per_day?: number | null
          date_last_contract_rcvd?: string | null
          extended_end_date?: string | null
          extended_gps_rate_per_day?: number | null
          extended_lease_rate_per_day?: number | null
          extended_lease_term?: string | null
          extended_start_date?: string | null
          extended_total_per_day?: number | null
          forrest_chz_id?: string | null
          gps_provider?: string | null
          hard_gps_number?: string | null
          initial_gps_rate_per_day?: number | null
          initial_lease_end_date?: string | null
          initial_lease_rate_per_day?: number | null
          initial_lease_start_date?: string | null
          initial_lease_term?: string | null
          initial_total_per_day?: number | null
          lease_id?: number
          lessor?: string | null
          pick_up_handling_fee?: number | null
          pick_up_location?: string | null
          return_handling_fee?: number | null
        }
        Relationships: []
      }
      logistics_shipments: {
        Row: {
          carrier_rate_charge: number | null
          created_date: string | null
          id: number
          item_description: string | null
          ld_num: string | null
          so_num: string | null
        }
        Insert: {
          carrier_rate_charge?: number | null
          created_date?: string | null
          id: number
          item_description?: string | null
          ld_num?: string | null
          so_num?: string | null
        }
        Update: {
          carrier_rate_charge?: number | null
          created_date?: string | null
          id?: number
          item_description?: string | null
          ld_num?: string | null
          so_num?: string | null
        }
        Relationships: []
      }
      revenue_report: {
        Row: {
          acct_mg_name: string | null
          actual_rc_date: string | null
          chassis_number: string | null
          container_number: string | null
          customer_name: string | null
          delivery_actual_date: string | null
          delivery_loc_name: string | null
          id: number
          ld_num: string | null
          pickup_loc_name: string | null
          so_num: string | null
        }
        Insert: {
          acct_mg_name?: string | null
          actual_rc_date?: string | null
          chassis_number?: string | null
          container_number?: string | null
          customer_name?: string | null
          delivery_actual_date?: string | null
          delivery_loc_name?: string | null
          id?: never
          ld_num?: string | null
          pickup_loc_name?: string | null
          so_num?: string | null
        }
        Update: {
          acct_mg_name?: string | null
          actual_rc_date?: string | null
          chassis_number?: string | null
          container_number?: string | null
          customer_name?: string | null
          delivery_actual_date?: string | null
          delivery_loc_name?: string | null
          id?: never
          ld_num?: string | null
          pickup_loc_name?: string | null
          so_num?: string | null
        }
        Relationships: []
      }
      short_term_leases: {
        Row: {
          booking_number: string | null
          chassis_id_used: string | null
          days_out: number | null
          location: string | null
          notes: string | null
          off_hire_date: string | null
          on_hire_date: string | null
          paid_amount_with_tax: number | null
          rate_per_day: number | null
          repair_costs_billed_milestone: number | null
          size_type: string | null
          stl_id: number
          total_repair_costs_forrest: number | null
          year_wk_offhire: string | null
          year_wk_onhire: string | null
        }
        Insert: {
          booking_number?: string | null
          chassis_id_used?: string | null
          days_out?: number | null
          location?: string | null
          notes?: string | null
          off_hire_date?: string | null
          on_hire_date?: string | null
          paid_amount_with_tax?: number | null
          rate_per_day?: number | null
          repair_costs_billed_milestone?: number | null
          size_type?: string | null
          stl_id?: number
          total_repair_costs_forrest?: number | null
          year_wk_offhire?: string | null
          year_wk_onhire?: string | null
        }
        Update: {
          booking_number?: string | null
          chassis_id_used?: string | null
          days_out?: number | null
          location?: string | null
          notes?: string | null
          off_hire_date?: string | null
          on_hire_date?: string | null
          paid_amount_with_tax?: number | null
          rate_per_day?: number | null
          repair_costs_billed_milestone?: number | null
          size_type?: string | null
          stl_id?: number
          total_repair_costs_forrest?: number | null
          year_wk_offhire?: string | null
          year_wk_onhire?: string | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      staging_file_rows: {
        Row: {
          bucket_id: string
          data: Json
          id: number
          imported_at: string
          object_name: string
          row_number: number
        }
        Insert: {
          bucket_id: string
          data: Json
          id?: number
          imported_at?: string
          object_name: string
          row_number: number
        }
        Update: {
          bucket_id?: string
          data?: Json
          id?: number
          imported_at?: string
          object_name?: string
          row_number?: number
        }
        Relationships: []
      }
      tms_mg: {
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
      vendors: {
        Row: {
          created_at: string | null
          id: string
          name: string
          scac: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          scac?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          scac?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      bytea_to_text: { Args: { data: string }; Returns: string }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      dropgeometrytable:
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_lines_needing_embeddings: {
        Args: never
        Returns: {
          bill_end: string
          bill_start: string
          billed_customer: string
          chassis_id: string
          container_id: string
          ig_location: string
          invoice_id: string
          invoice_number: string
          line_id: number
          og_location: string
          total: number
          use_days: number
          vendor_id: string
          vendor_name: string
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      match_invoice_lines: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          invoice_id: string
          line_id: number
          similarity: number
        }[]
      }
      match_line_to_revenue: { Args: { _line_id: number }; Returns: undefined }
      populate_geometry_columns:
        | { Args: { use_typmod?: boolean }; Returns: string }
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      search_invoice_lines: {
        Args: {
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
          vendor?: string
        }
        Returns: {
          content: string
          invoice_id: string
          line_id: number
          similarity: number
          vendor_name: string
        }[]
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_askml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geom: unknown }; Returns: number }
        | { Args: { geog: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      text_to_bytea: { Args: { data: string }; Returns: string }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
