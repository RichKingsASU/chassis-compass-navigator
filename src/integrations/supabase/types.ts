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
      charge_codes: {
        Row: {
          code: string
          description: string | null
          vendor_id: string | null
        }
        Insert: {
          code: string
          description?: string | null
          vendor_id?: string | null
        }
        Update: {
          code?: string
          description?: string | null
          vendor_id?: string | null
        }
        Relationships: []
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
      customer_contract: {
        Row: {
          chassis_allowed: boolean | null
          customer_name: string | null
          effective_from: string | null
          effective_to: string | null
          id: number
          ssl: string | null
        }
        Insert: {
          chassis_allowed?: boolean | null
          customer_name?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: number
          ssl?: string | null
        }
        Update: {
          chassis_allowed?: boolean | null
          customer_name?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: number
          ssl?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      damage_codes: {
        Row: {
          code: string
          description: string | null
        }
        Insert: {
          code: string
          description?: string | null
        }
        Update: {
          code?: string
          description?: string | null
        }
        Relationships: []
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
      dcli_invoice_line_staging: {
        Row: {
          attachment_count: number | null
          chassis_out: string | null
          container_in: string | null
          container_out: string | null
          created_at: string | null
          date_in: string | null
          date_out: string | null
          dispute_status: string | null
          id: number
          invoice_status: string | null
          invoice_total: number | null
          invoice_type: string | null
          line_index: number | null
          line_invoice_number: string | null
          raw: Json | null
          remaining_balance: number | null
          staging_invoice_id: string | null
          tms_match_confidence: number | null
          tms_match_id: string | null
          tms_match_type: string | null
          validation_issues: Json | null
        }
        Insert: {
          attachment_count?: number | null
          chassis_out?: string | null
          container_in?: string | null
          container_out?: string | null
          created_at?: string | null
          date_in?: string | null
          date_out?: string | null
          dispute_status?: string | null
          id?: number
          invoice_status?: string | null
          invoice_total?: number | null
          invoice_type?: string | null
          line_index?: number | null
          line_invoice_number?: string | null
          raw?: Json | null
          remaining_balance?: number | null
          staging_invoice_id?: string | null
          tms_match_confidence?: number | null
          tms_match_id?: string | null
          tms_match_type?: string | null
          validation_issues?: Json | null
        }
        Update: {
          attachment_count?: number | null
          chassis_out?: string | null
          container_in?: string | null
          container_out?: string | null
          created_at?: string | null
          date_in?: string | null
          date_out?: string | null
          dispute_status?: string | null
          id?: number
          invoice_status?: string | null
          invoice_total?: number | null
          invoice_type?: string | null
          line_index?: number | null
          line_invoice_number?: string | null
          raw?: Json | null
          remaining_balance?: number | null
          staging_invoice_id?: string | null
          tms_match_confidence?: number | null
          tms_match_id?: string | null
          tms_match_type?: string | null
          validation_issues?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dcli_invoice_line_staging_staging_invoice_id_fkey"
            columns: ["staging_invoice_id"]
            isOneToOne: false
            referencedRelation: "dcli_invoice_staging"
            referencedColumns: ["id"]
          },
        ]
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
      dcli_invoice_staging: {
        Row: {
          account_code: string | null
          amount_due: number | null
          attachments: Json | null
          billing_date: string | null
          billing_terms: string | null
          created_at: string | null
          created_by: string | null
          currency_code: string | null
          due_date: string | null
          excel_path: string | null
          id: string
          pdf_path: string | null
          pool: string | null
          processed_at: string | null
          source_hash: string | null
          status: string | null
          summary_invoice_id: string | null
          validation_results: Json | null
          validation_status: string | null
          vendor: string | null
        }
        Insert: {
          account_code?: string | null
          amount_due?: number | null
          attachments?: Json | null
          billing_date?: string | null
          billing_terms?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          due_date?: string | null
          excel_path?: string | null
          id?: string
          pdf_path?: string | null
          pool?: string | null
          processed_at?: string | null
          source_hash?: string | null
          status?: string | null
          summary_invoice_id?: string | null
          validation_results?: Json | null
          validation_status?: string | null
          vendor?: string | null
        }
        Update: {
          account_code?: string | null
          amount_due?: number | null
          attachments?: Json | null
          billing_date?: string | null
          billing_terms?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          due_date?: string | null
          excel_path?: string | null
          id?: string
          pdf_path?: string | null
          pool?: string | null
          processed_at?: string | null
          source_hash?: string | null
          status?: string | null
          summary_invoice_id?: string | null
          validation_results?: Json | null
          validation_status?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      dcli_line_comments: {
        Row: {
          comment: string
          created_at: string
          created_by: string
          id: string
          line_invoice_number: string
        }
        Insert: {
          comment: string
          created_at?: string
          created_by: string
          id?: string
          line_invoice_number: string
        }
        Update: {
          comment?: string
          created_at?: string
          created_by?: string
          id?: string
          line_invoice_number?: string
        }
        Relationships: []
      }
      defect_codes: {
        Row: {
          code: string
          description: string | null
        }
        Insert: {
          code: string
          description?: string | null
        }
        Update: {
          code?: string
          description?: string | null
        }
        Relationships: []
      }
      dim_customer: {
        Row: {
          customer_id: number
          customer_name: string
        }
        Insert: {
          customer_id?: never
          customer_name: string
        }
        Update: {
          customer_id?: never
          customer_name?: string
        }
        Relationships: []
      }
      dim_ep: {
        Row: {
          ep_id: number
          ep_name: string
        }
        Insert: {
          ep_id?: never
          ep_name: string
        }
        Update: {
          ep_id?: never
          ep_name?: string
        }
        Relationships: []
      }
      dim_lane: {
        Row: {
          destination_location_id: number | null
          lane_id: number
          origin_location_id: number | null
        }
        Insert: {
          destination_location_id?: number | null
          lane_id?: never
          origin_location_id?: number | null
        }
        Update: {
          destination_location_id?: number | null
          lane_id?: never
          origin_location_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dim_lane_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "dim_location"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "dim_lane_origin_location_id_fkey"
            columns: ["origin_location_id"]
            isOneToOne: false
            referencedRelation: "dim_location"
            referencedColumns: ["location_id"]
          },
        ]
      }
      dim_location: {
        Row: {
          city: string | null
          location_id: number
          region: string | null
          state: string | null
        }
        Insert: {
          city?: string | null
          location_id?: never
          region?: string | null
          state?: string | null
        }
        Update: {
          city?: string | null
          location_id?: never
          region?: string | null
          state?: string | null
        }
        Relationships: []
      }
      dim_pool: {
        Row: {
          pool_id: number
          pool_name: string
        }
        Insert: {
          pool_id?: never
          pool_name: string
        }
        Update: {
          pool_id?: never
          pool_name?: string
        }
        Relationships: []
      }
      dim_size: {
        Row: {
          size_id: number
          size_label: string
        }
        Insert: {
          size_id?: never
          size_label: string
        }
        Update: {
          size_id?: never
          size_label?: string
        }
        Relationships: []
      }
      dim_ssl: {
        Row: {
          ssl_id: number
          ssl_name: string
        }
        Insert: {
          ssl_id?: never
          ssl_name: string
        }
        Update: {
          ssl_id?: never
          ssl_name?: string
        }
        Relationships: []
      }
      dim_vendor: {
        Row: {
          vendor_id: number
          vendor_name: string
        }
        Insert: {
          vendor_id?: never
          vendor_name: string
        }
        Update: {
          vendor_id?: never
          vendor_name?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          ext_ref: string | null
          full_name: string
          id: string
        }
        Insert: {
          ext_ref?: string | null
          full_name: string
          id?: string
        }
        Update: {
          ext_ref?: string | null
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      fact_chassis_rate: {
        Row: {
          charge_description: string | null
          created_at: string | null
          daily_rate: number | null
          effective_date: string | null
          end_date: string | null
          equipment_code: string | null
          gate_in_fee: number | null
          gate_out_fee: number | null
          lane_id: number | null
          notes: string | null
          other_fee: number | null
          pool_id: number | null
          rate_id: number
          size_id: number | null
          source_row: number | null
          source_sheet: string
          total_fee: number | null
          vendor_id: number | null
        }
        Insert: {
          charge_description?: string | null
          created_at?: string | null
          daily_rate?: number | null
          effective_date?: string | null
          end_date?: string | null
          equipment_code?: string | null
          gate_in_fee?: number | null
          gate_out_fee?: number | null
          lane_id?: number | null
          notes?: string | null
          other_fee?: number | null
          pool_id?: number | null
          rate_id?: never
          size_id?: number | null
          source_row?: number | null
          source_sheet: string
          total_fee?: number | null
          vendor_id?: number | null
        }
        Update: {
          charge_description?: string | null
          created_at?: string | null
          daily_rate?: number | null
          effective_date?: string | null
          end_date?: string | null
          equipment_code?: string | null
          gate_in_fee?: number | null
          gate_out_fee?: number | null
          lane_id?: number | null
          notes?: string | null
          other_fee?: number | null
          pool_id?: number | null
          rate_id?: never
          size_id?: number | null
          source_row?: number | null
          source_sheet?: string
          total_fee?: number | null
          vendor_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_chassis_rate_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "dim_lane"
            referencedColumns: ["lane_id"]
          },
          {
            foreignKeyName: "fact_chassis_rate_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "dim_pool"
            referencedColumns: ["pool_id"]
          },
          {
            foreignKeyName: "fact_chassis_rate_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "dim_size"
            referencedColumns: ["size_id"]
          },
          {
            foreignKeyName: "fact_chassis_rate_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "dim_vendor"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      fact_chassis_rate_terms: {
        Row: {
          agreement_ep: string | null
          agreement_ssl: string | null
          all_in_rate: boolean | null
          all_in_rate_so: number | null
          carrier_chz_rate_ld_per_day: number | null
          created_at: string | null
          customer_id: number | null
          effective_date: string | null
          ep_id: number | null
          flat_chz_rate: boolean | null
          flat_chz_rate_so: number | null
          free_time_days: number | null
          id: number
          import_export: string | null
          lane_id: number | null
          line_haul_so: number | null
          notes: string | null
          pool_chz_accepted: boolean | null
          pool_chz_rate_so_per_day: number | null
          private_chz_accepted: boolean | null
          private_chz_rate_so: number | null
          round_trip: boolean | null
          single_trip: boolean | null
          source_row: number | null
          ssl_id: number | null
          triaxle_chz_rate_so: number | null
        }
        Insert: {
          agreement_ep?: string | null
          agreement_ssl?: string | null
          all_in_rate?: boolean | null
          all_in_rate_so?: number | null
          carrier_chz_rate_ld_per_day?: number | null
          created_at?: string | null
          customer_id?: number | null
          effective_date?: string | null
          ep_id?: number | null
          flat_chz_rate?: boolean | null
          flat_chz_rate_so?: number | null
          free_time_days?: number | null
          id?: never
          import_export?: string | null
          lane_id?: number | null
          line_haul_so?: number | null
          notes?: string | null
          pool_chz_accepted?: boolean | null
          pool_chz_rate_so_per_day?: number | null
          private_chz_accepted?: boolean | null
          private_chz_rate_so?: number | null
          round_trip?: boolean | null
          single_trip?: boolean | null
          source_row?: number | null
          ssl_id?: number | null
          triaxle_chz_rate_so?: number | null
        }
        Update: {
          agreement_ep?: string | null
          agreement_ssl?: string | null
          all_in_rate?: boolean | null
          all_in_rate_so?: number | null
          carrier_chz_rate_ld_per_day?: number | null
          created_at?: string | null
          customer_id?: number | null
          effective_date?: string | null
          ep_id?: number | null
          flat_chz_rate?: boolean | null
          flat_chz_rate_so?: number | null
          free_time_days?: number | null
          id?: never
          import_export?: string | null
          lane_id?: number | null
          line_haul_so?: number | null
          notes?: string | null
          pool_chz_accepted?: boolean | null
          pool_chz_rate_so_per_day?: number | null
          private_chz_accepted?: boolean | null
          private_chz_rate_so?: number | null
          round_trip?: boolean | null
          single_trip?: boolean | null
          source_row?: number | null
          ssl_id?: number | null
          triaxle_chz_rate_so?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_chassis_rate_terms_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "dim_customer"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fact_chassis_rate_terms_ep_id_fkey"
            columns: ["ep_id"]
            isOneToOne: false
            referencedRelation: "dim_ep"
            referencedColumns: ["ep_id"]
          },
          {
            foreignKeyName: "fact_chassis_rate_terms_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "dim_lane"
            referencedColumns: ["lane_id"]
          },
          {
            foreignKeyName: "fact_chassis_rate_terms_ssl_id_fkey"
            columns: ["ssl_id"]
            isOneToOne: false
            referencedRelation: "dim_ssl"
            referencedColumns: ["ssl_id"]
          },
        ]
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
      geo_master_address: {
        Row: {
          _loaded_at: string | null
          administrative_area_level_1: string | null
          administrative_area_level_2: string | null
          bounds_ne_lat: number | null
          bounds_ne_lng: number | null
          bounds_sw_lat: number | null
          bounds_sw_lng: number | null
          country: string | null
          formatted_address: string | null
          geog: unknown
          google_maps_url: string | null
          lat: number | null
          lng: number | null
          locality: string | null
          location_type: string | null
          neighborhood: string | null
          partial_match: boolean | null
          place_id: string
          plus_code_compound_code: string | null
          plus_code_global_code: string | null
          postal_code: string | null
          premise: string | null
          route: string | null
          street_number: string | null
          sublocality: string | null
          subpremise: string | null
          types_raw: string | null
          viewport_ne_lat: number | null
          viewport_ne_lng: number | null
          viewport_sw_lat: number | null
          viewport_sw_lng: number | null
        }
        Insert: {
          _loaded_at?: string | null
          administrative_area_level_1?: string | null
          administrative_area_level_2?: string | null
          bounds_ne_lat?: number | null
          bounds_ne_lng?: number | null
          bounds_sw_lat?: number | null
          bounds_sw_lng?: number | null
          country?: string | null
          formatted_address?: string | null
          geog?: unknown
          google_maps_url?: string | null
          lat?: number | null
          lng?: number | null
          locality?: string | null
          location_type?: string | null
          neighborhood?: string | null
          partial_match?: boolean | null
          place_id: string
          plus_code_compound_code?: string | null
          plus_code_global_code?: string | null
          postal_code?: string | null
          premise?: string | null
          route?: string | null
          street_number?: string | null
          sublocality?: string | null
          subpremise?: string | null
          types_raw?: string | null
          viewport_ne_lat?: number | null
          viewport_ne_lng?: number | null
          viewport_sw_lat?: number | null
          viewport_sw_lng?: number | null
        }
        Update: {
          _loaded_at?: string | null
          administrative_area_level_1?: string | null
          administrative_area_level_2?: string | null
          bounds_ne_lat?: number | null
          bounds_ne_lng?: number | null
          bounds_sw_lat?: number | null
          bounds_sw_lng?: number | null
          country?: string | null
          formatted_address?: string | null
          geog?: unknown
          google_maps_url?: string | null
          lat?: number | null
          lng?: number | null
          locality?: string | null
          location_type?: string | null
          neighborhood?: string | null
          partial_match?: boolean | null
          place_id?: string
          plus_code_compound_code?: string | null
          plus_code_global_code?: string | null
          postal_code?: string | null
          premise?: string | null
          route?: string | null
          street_number?: string | null
          sublocality?: string | null
          subpremise?: string | null
          types_raw?: string | null
          viewport_ne_lat?: number | null
          viewport_ne_lng?: number | null
          viewport_sw_lat?: number | null
          viewport_sw_lng?: number | null
        }
        Relationships: []
      }
      geo_master_address_stg: {
        Row: {
          administrative_area_level_1: string | null
          administrative_area_level_2: string | null
          bounds_ne_lat: string | null
          bounds_ne_lng: string | null
          bounds_sw_lat: string | null
          bounds_sw_lng: string | null
          country: string | null
          formatted_address: string | null
          google_maps_url: string | null
          lat: string | null
          lng: string | null
          locality: string | null
          location_type: string | null
          neighborhood: string | null
          partial_match: string | null
          place_id: string | null
          plus_code_compound_code: string | null
          plus_code_global_code: string | null
          postal_code: string | null
          premise: string | null
          route: string | null
          street_number: string | null
          sublocality: string | null
          subpremise: string | null
          types: string | null
          viewport_ne_lat: string | null
          viewport_ne_lng: string | null
          viewport_sw_lat: string | null
          viewport_sw_lng: string | null
        }
        Insert: {
          administrative_area_level_1?: string | null
          administrative_area_level_2?: string | null
          bounds_ne_lat?: string | null
          bounds_ne_lng?: string | null
          bounds_sw_lat?: string | null
          bounds_sw_lng?: string | null
          country?: string | null
          formatted_address?: string | null
          google_maps_url?: string | null
          lat?: string | null
          lng?: string | null
          locality?: string | null
          location_type?: string | null
          neighborhood?: string | null
          partial_match?: string | null
          place_id?: string | null
          plus_code_compound_code?: string | null
          plus_code_global_code?: string | null
          postal_code?: string | null
          premise?: string | null
          route?: string | null
          street_number?: string | null
          sublocality?: string | null
          subpremise?: string | null
          types?: string | null
          viewport_ne_lat?: string | null
          viewport_ne_lng?: string | null
          viewport_sw_lat?: string | null
          viewport_sw_lng?: string | null
        }
        Update: {
          administrative_area_level_1?: string | null
          administrative_area_level_2?: string | null
          bounds_ne_lat?: string | null
          bounds_ne_lng?: string | null
          bounds_sw_lat?: string | null
          bounds_sw_lng?: string | null
          country?: string | null
          formatted_address?: string | null
          google_maps_url?: string | null
          lat?: string | null
          lng?: string | null
          locality?: string | null
          location_type?: string | null
          neighborhood?: string | null
          partial_match?: string | null
          place_id?: string | null
          plus_code_compound_code?: string | null
          plus_code_global_code?: string | null
          postal_code?: string | null
          premise?: string | null
          route?: string | null
          street_number?: string | null
          sublocality?: string | null
          subpremise?: string | null
          types?: string | null
          viewport_ne_lat?: string | null
          viewport_ne_lng?: string | null
          viewport_sw_lat?: string | null
          viewport_sw_lng?: string | null
        }
        Relationships: []
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
      gps_providers: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
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
      invoice_line_audit: {
        Row: {
          action: string | null
          created_at: string | null
          created_by: string | null
          delta_amount: number | null
          id: number
          invoice_line_id: number
          reason: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          created_by?: string | null
          delta_amount?: number | null
          id?: number
          invoice_line_id: number
          reason?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          created_by?: string | null
          delta_amount?: number | null
          id?: number
          invoice_line_id?: number
          reason?: string | null
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
      locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          fence: unknown
          geom: unknown
          id: string
          kind: string | null
          name: string
          state: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          fence?: unknown
          geom?: unknown
          id?: string
          kind?: string | null
          name: string
          state?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          fence?: unknown
          geom?: unknown
          id?: string
          kind?: string | null
          name?: string
          state?: string | null
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
      master_chassis: {
        Row: {
          chassis_number: string
          created_at: string
          gps_device_id: string | null
          gps_provider_id: string | null
          id: string
          in_service_date: string | null
          last_ping_at: string | null
          last_ping_loc: unknown
          lease_vendor_id: string | null
          notes: string | null
          out_of_service_date: string | null
          owner_vendor_id: string | null
          pool_vendor_id: string | null
          prefix: string | null
          serial_number: string | null
          size_ft: number | null
          status: string | null
          tms_reference: string | null
          updated_at: string
          yard_id: string | null
        }
        Insert: {
          chassis_number: string
          created_at?: string
          gps_device_id?: string | null
          gps_provider_id?: string | null
          id?: string
          in_service_date?: string | null
          last_ping_at?: string | null
          last_ping_loc?: unknown
          lease_vendor_id?: string | null
          notes?: string | null
          out_of_service_date?: string | null
          owner_vendor_id?: string | null
          pool_vendor_id?: string | null
          prefix?: string | null
          serial_number?: string | null
          size_ft?: number | null
          status?: string | null
          tms_reference?: string | null
          updated_at?: string
          yard_id?: string | null
        }
        Update: {
          chassis_number?: string
          created_at?: string
          gps_device_id?: string | null
          gps_provider_id?: string | null
          id?: string
          in_service_date?: string | null
          last_ping_at?: string | null
          last_ping_loc?: unknown
          lease_vendor_id?: string | null
          notes?: string | null
          out_of_service_date?: string | null
          owner_vendor_id?: string | null
          pool_vendor_id?: string | null
          prefix?: string | null
          serial_number?: string | null
          size_ft?: number | null
          status?: string | null
          tms_reference?: string | null
          updated_at?: string
          yard_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_chassis_gps_provider_id_fkey"
            columns: ["gps_provider_id"]
            isOneToOne: false
            referencedRelation: "gps_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_chassis_lease_vendor_id_fkey"
            columns: ["lease_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_chassis_owner_vendor_id_fkey"
            columns: ["owner_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_chassis_pool_vendor_id_fkey"
            columns: ["pool_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_chassis_yard_id_fkey"
            columns: ["yard_id"]
            isOneToOne: false
            referencedRelation: "yards"
            referencedColumns: ["id"]
          },
        ]
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
      mg_tms_data: {
        Row: {
          acct_mg_name: string | null
          actual_rc_date: string | null
          available_at_port_date: string | null
          carrier_invoice_charge: number | null
          carrier_invoice_date: string | null
          carrier_invoice_num: string | null
          carrier_name: string | null
          carrier_rate_charge: number | null
          carrier_scac_code: string | null
          carrier_total_accessorials_rate: number | null
          carrier_total_invoice_detention: number | null
          carrier_total_invoice_fuel: number | null
          carrier_total_invoice_linehaul: number | null
          carrier_total_invoice_other: number | null
          carrier_total_rate_detention: number | null
          carrier_total_rate_fuel: number | null
          carrier_total_rate_linehaul: number | null
          carrier_total_rate_other: number | null
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
          cust_invoice_charge: number | null
          cust_invoice_date: string | null
          cust_invoice_num: string | null
          cust_rate_charge: number | null
          cust_total_invoice_detention: number | null
          cust_total_invoice_fuel: number | null
          cust_total_invoice_linehaul: number | null
          cust_total_invoice_other: number | null
          cust_total_rate_detention: number | null
          cust_total_rate_fuel: number | null
          cust_total_rate_linehaul: number | null
          customer_account_number: string | null
          customer_invoice_requested_date: string | null
          customer_name: string | null
          customer_reference_number: string | null
          customer_total_accessorials_rate: number | null
          customer_total_invoice_accessorials: number | null
          cycle_create_tendered: number | null
          cycle_delivery_custinvreq: number | null
          cycle_delivery_pod: number | null
          cycle_delivery_rc: number | null
          cycle_pickup_delivery: number | null
          cycle_tendered_pickup: number | null
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
          departed_rail_date: number | null
          direct_nvo: string | null
          domestic_move: number | null
          dotnumber: number | null
          dropandpull: string | null
          empty_pickup_date: string | null
          entreprise_num: string | null
          future_actual_delivery: string | null
          future_custinvreqdate: string | null
          future_pod_date: string | null
          future_rc_date: string | null
          id: string | null
          isemptyatyard: string | null
          isemptycontainerpickup: number | null
          item_description: string | null
          last_free_date: string | null
          ld_num: string | null
          ld_num_format: string | null
          load_complexity: string | null
          masterbolkey: number | null
          mbl: string | null
          mbl_format: string | null
          mcnumber: number | null
          miles: number | null
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
          pk_id: number
          pod_added_date: string | null
          pod_received: boolean | null
          pod_status: string | null
          quantity: number | null
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
          source_file: string | null
          source_file_key: number | null
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
          weight: number | null
          zero_rev: string | null
        }
        Insert: {
          acct_mg_name?: string | null
          actual_rc_date?: string | null
          available_at_port_date?: string | null
          carrier_invoice_charge?: number | null
          carrier_invoice_date?: string | null
          carrier_invoice_num?: string | null
          carrier_name?: string | null
          carrier_rate_charge?: number | null
          carrier_scac_code?: string | null
          carrier_total_accessorials_rate?: number | null
          carrier_total_invoice_detention?: number | null
          carrier_total_invoice_fuel?: number | null
          carrier_total_invoice_linehaul?: number | null
          carrier_total_invoice_other?: number | null
          carrier_total_rate_detention?: number | null
          carrier_total_rate_fuel?: number | null
          carrier_total_rate_linehaul?: number | null
          carrier_total_rate_other?: number | null
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
          cust_invoice_charge?: number | null
          cust_invoice_date?: string | null
          cust_invoice_num?: string | null
          cust_rate_charge?: number | null
          cust_total_invoice_detention?: number | null
          cust_total_invoice_fuel?: number | null
          cust_total_invoice_linehaul?: number | null
          cust_total_invoice_other?: number | null
          cust_total_rate_detention?: number | null
          cust_total_rate_fuel?: number | null
          cust_total_rate_linehaul?: number | null
          customer_account_number?: string | null
          customer_invoice_requested_date?: string | null
          customer_name?: string | null
          customer_reference_number?: string | null
          customer_total_accessorials_rate?: number | null
          customer_total_invoice_accessorials?: number | null
          cycle_create_tendered?: number | null
          cycle_delivery_custinvreq?: number | null
          cycle_delivery_pod?: number | null
          cycle_delivery_rc?: number | null
          cycle_pickup_delivery?: number | null
          cycle_tendered_pickup?: number | null
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
          departed_rail_date?: number | null
          direct_nvo?: string | null
          domestic_move?: number | null
          dotnumber?: number | null
          dropandpull?: string | null
          empty_pickup_date?: string | null
          entreprise_num?: string | null
          future_actual_delivery?: string | null
          future_custinvreqdate?: string | null
          future_pod_date?: string | null
          future_rc_date?: string | null
          id?: string | null
          isemptyatyard?: string | null
          isemptycontainerpickup?: number | null
          item_description?: string | null
          last_free_date?: string | null
          ld_num?: string | null
          ld_num_format?: string | null
          load_complexity?: string | null
          masterbolkey?: number | null
          mbl?: string | null
          mbl_format?: string | null
          mcnumber?: number | null
          miles?: number | null
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
          pk_id?: number
          pod_added_date?: string | null
          pod_received?: boolean | null
          pod_status?: string | null
          quantity?: number | null
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
          source_file?: string | null
          source_file_key?: number | null
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
          weight?: number | null
          zero_rev?: string | null
        }
        Update: {
          acct_mg_name?: string | null
          actual_rc_date?: string | null
          available_at_port_date?: string | null
          carrier_invoice_charge?: number | null
          carrier_invoice_date?: string | null
          carrier_invoice_num?: string | null
          carrier_name?: string | null
          carrier_rate_charge?: number | null
          carrier_scac_code?: string | null
          carrier_total_accessorials_rate?: number | null
          carrier_total_invoice_detention?: number | null
          carrier_total_invoice_fuel?: number | null
          carrier_total_invoice_linehaul?: number | null
          carrier_total_invoice_other?: number | null
          carrier_total_rate_detention?: number | null
          carrier_total_rate_fuel?: number | null
          carrier_total_rate_linehaul?: number | null
          carrier_total_rate_other?: number | null
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
          cust_invoice_charge?: number | null
          cust_invoice_date?: string | null
          cust_invoice_num?: string | null
          cust_rate_charge?: number | null
          cust_total_invoice_detention?: number | null
          cust_total_invoice_fuel?: number | null
          cust_total_invoice_linehaul?: number | null
          cust_total_invoice_other?: number | null
          cust_total_rate_detention?: number | null
          cust_total_rate_fuel?: number | null
          cust_total_rate_linehaul?: number | null
          customer_account_number?: string | null
          customer_invoice_requested_date?: string | null
          customer_name?: string | null
          customer_reference_number?: string | null
          customer_total_accessorials_rate?: number | null
          customer_total_invoice_accessorials?: number | null
          cycle_create_tendered?: number | null
          cycle_delivery_custinvreq?: number | null
          cycle_delivery_pod?: number | null
          cycle_delivery_rc?: number | null
          cycle_pickup_delivery?: number | null
          cycle_tendered_pickup?: number | null
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
          departed_rail_date?: number | null
          direct_nvo?: string | null
          domestic_move?: number | null
          dotnumber?: number | null
          dropandpull?: string | null
          empty_pickup_date?: string | null
          entreprise_num?: string | null
          future_actual_delivery?: string | null
          future_custinvreqdate?: string | null
          future_pod_date?: string | null
          future_rc_date?: string | null
          id?: string | null
          isemptyatyard?: string | null
          isemptycontainerpickup?: number | null
          item_description?: string | null
          last_free_date?: string | null
          ld_num?: string | null
          ld_num_format?: string | null
          load_complexity?: string | null
          masterbolkey?: number | null
          mbl?: string | null
          mbl_format?: string | null
          mcnumber?: number | null
          miles?: number | null
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
          pk_id?: number
          pod_added_date?: string | null
          pod_received?: boolean | null
          pod_status?: string | null
          quantity?: number | null
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
          source_file?: string | null
          source_file_key?: number | null
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
          weight?: number | null
          zero_rev?: string | null
        }
        Relationships: []
      }
      mg_tms_raw: {
        Row: {
          created_at: string
          data: Json
          id: number
          row_key: string | null
          row_num: number
          source_bucket: string
          source_file: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: number
          row_key?: string | null
          row_num: number
          source_bucket: string
          source_file: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: number
          row_key?: string | null
          row_num?: number
          source_bucket?: string
          source_file?: string
        }
        Relationships: []
      }
      mg_tms_raw_dlq: {
        Row: {
          created_at: string
          error: string | null
          id: number
          payload: Json | null
          row_num: number | null
          source_bucket: string | null
          source_file: string | null
          stage: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: number
          payload?: Json | null
          row_num?: number | null
          source_bucket?: string | null
          source_file?: string | null
          stage: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: number
          payload?: Json | null
          row_num?: number | null
          source_bucket?: string | null
          source_file?: string | null
          stage?: string
        }
        Relationships: []
      }
      mg_tms_stg: {
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
      mg_tms_ytd: {
        Row: {
          acct_mg_name: string | null
          actual_rc_date: string | null
          available_at_port_date: string | null
          carrier_invoice_charge: number | null
          carrier_invoice_date: string | null
          carrier_invoice_num: string | null
          carrier_name: string | null
          carrier_rate_charge: number | null
          carrier_scac_code: string | null
          carrier_total_accessorials_rate: number | null
          carrier_total_invoice_detention: number | null
          carrier_total_invoice_fuel: number | null
          carrier_total_invoice_linehaul: string | null
          carrier_total_invoice_other: string | null
          carrier_total_rate_detention: number | null
          carrier_total_rate_fuel: number | null
          carrier_total_rate_linehaul: number | null
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
          cust_invoice_charge: number | null
          cust_invoice_date: string | null
          cust_invoice_num: string | null
          cust_rate_charge: number | null
          cust_total_invoice_detention: number | null
          cust_total_invoice_fuel: number | null
          cust_total_invoice_linehaul: number | null
          cust_total_invoice_other: number | null
          cust_total_rate_detention: number | null
          cust_total_rate_fuel: number | null
          cust_total_rate_linehaul: number | null
          customer_account_number: string | null
          customer_invoice_requested_date: string | null
          customer_name: string | null
          customer_reference_number: string | null
          customer_total_accessorials_rate: number | null
          customer_total_invoice_accessorials: number | null
          cycle_create_tendered: number | null
          cycle_delivery_custinvreq: number | null
          cycle_delivery_pod: number | null
          cycle_delivery_rc: number | null
          cycle_pickup_delivery: number | null
          cycle_tendered_pickup: number | null
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
          dotnumber: number | null
          dropandpull: string | null
          empty_pickup_date: string | null
          entreprise_num: string | null
          future_actual_delivery: number | null
          future_custinvreqdate: number | null
          future_pod_date: number | null
          future_rc_date: number | null
          id: number | null
          isemptyatyard: string | null
          isemptycontainerpickup: string | null
          item_description: string | null
          last_free_date: string | null
          ld_num: string | null
          ld_num_format: string | null
          load_complexity: string | null
          masterbolkey: number | null
          mbl: string | null
          mbl_format: string | null
          mcnumber: number | null
          miles: number | null
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
          quantity: number | null
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
          source_file_key: number | null
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
          weight: number | null
          zero_rev: string | null
        }
        Insert: {
          acct_mg_name?: string | null
          actual_rc_date?: string | null
          available_at_port_date?: string | null
          carrier_invoice_charge?: number | null
          carrier_invoice_date?: string | null
          carrier_invoice_num?: string | null
          carrier_name?: string | null
          carrier_rate_charge?: number | null
          carrier_scac_code?: string | null
          carrier_total_accessorials_rate?: number | null
          carrier_total_invoice_detention?: number | null
          carrier_total_invoice_fuel?: number | null
          carrier_total_invoice_linehaul?: string | null
          carrier_total_invoice_other?: string | null
          carrier_total_rate_detention?: number | null
          carrier_total_rate_fuel?: number | null
          carrier_total_rate_linehaul?: number | null
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
          cust_invoice_charge?: number | null
          cust_invoice_date?: string | null
          cust_invoice_num?: string | null
          cust_rate_charge?: number | null
          cust_total_invoice_detention?: number | null
          cust_total_invoice_fuel?: number | null
          cust_total_invoice_linehaul?: number | null
          cust_total_invoice_other?: number | null
          cust_total_rate_detention?: number | null
          cust_total_rate_fuel?: number | null
          cust_total_rate_linehaul?: number | null
          customer_account_number?: string | null
          customer_invoice_requested_date?: string | null
          customer_name?: string | null
          customer_reference_number?: string | null
          customer_total_accessorials_rate?: number | null
          customer_total_invoice_accessorials?: number | null
          cycle_create_tendered?: number | null
          cycle_delivery_custinvreq?: number | null
          cycle_delivery_pod?: number | null
          cycle_delivery_rc?: number | null
          cycle_pickup_delivery?: number | null
          cycle_tendered_pickup?: number | null
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
          dotnumber?: number | null
          dropandpull?: string | null
          empty_pickup_date?: string | null
          entreprise_num?: string | null
          future_actual_delivery?: number | null
          future_custinvreqdate?: number | null
          future_pod_date?: number | null
          future_rc_date?: number | null
          id?: number | null
          isemptyatyard?: string | null
          isemptycontainerpickup?: string | null
          item_description?: string | null
          last_free_date?: string | null
          ld_num?: string | null
          ld_num_format?: string | null
          load_complexity?: string | null
          masterbolkey?: number | null
          mbl?: string | null
          mbl_format?: string | null
          mcnumber?: number | null
          miles?: number | null
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
          quantity?: number | null
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
          source_file_key?: number | null
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
          weight?: number | null
          zero_rev?: string | null
        }
        Update: {
          acct_mg_name?: string | null
          actual_rc_date?: string | null
          available_at_port_date?: string | null
          carrier_invoice_charge?: number | null
          carrier_invoice_date?: string | null
          carrier_invoice_num?: string | null
          carrier_name?: string | null
          carrier_rate_charge?: number | null
          carrier_scac_code?: string | null
          carrier_total_accessorials_rate?: number | null
          carrier_total_invoice_detention?: number | null
          carrier_total_invoice_fuel?: number | null
          carrier_total_invoice_linehaul?: string | null
          carrier_total_invoice_other?: string | null
          carrier_total_rate_detention?: number | null
          carrier_total_rate_fuel?: number | null
          carrier_total_rate_linehaul?: number | null
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
          cust_invoice_charge?: number | null
          cust_invoice_date?: string | null
          cust_invoice_num?: string | null
          cust_rate_charge?: number | null
          cust_total_invoice_detention?: number | null
          cust_total_invoice_fuel?: number | null
          cust_total_invoice_linehaul?: number | null
          cust_total_invoice_other?: number | null
          cust_total_rate_detention?: number | null
          cust_total_rate_fuel?: number | null
          cust_total_rate_linehaul?: number | null
          customer_account_number?: string | null
          customer_invoice_requested_date?: string | null
          customer_name?: string | null
          customer_reference_number?: string | null
          customer_total_accessorials_rate?: number | null
          customer_total_invoice_accessorials?: number | null
          cycle_create_tendered?: number | null
          cycle_delivery_custinvreq?: number | null
          cycle_delivery_pod?: number | null
          cycle_delivery_rc?: number | null
          cycle_pickup_delivery?: number | null
          cycle_tendered_pickup?: number | null
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
          dotnumber?: number | null
          dropandpull?: string | null
          empty_pickup_date?: string | null
          entreprise_num?: string | null
          future_actual_delivery?: number | null
          future_custinvreqdate?: number | null
          future_pod_date?: number | null
          future_rc_date?: number | null
          id?: number | null
          isemptyatyard?: string | null
          isemptycontainerpickup?: string | null
          item_description?: string | null
          last_free_date?: string | null
          ld_num?: string | null
          ld_num_format?: string | null
          load_complexity?: string | null
          masterbolkey?: number | null
          mbl?: string | null
          mbl_format?: string | null
          mcnumber?: number | null
          miles?: number | null
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
          quantity?: number | null
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
          source_file_key?: number | null
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
          weight?: number | null
          zero_rev?: string | null
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
      stg_chassis_rate_logic: {
        Row: {
          agreement_w__ep: string | null
          agreement_w__ssl: string | null
          "all_in_rate_(so_$)": number | null
          "all_in_rate_(y_n)": string | null
          "carrier_chz_rate_(ld__$_day)": string | null
          customer: string | null
          delivery_city: string | null
          delivery_state: string | null
          effective_date: string | null
          ep: string | null
          "flat_chz_rate_(so_$)": number | null
          "flat_chz_rate_(y_n)": string | null
          "free_time_(days)": number | null
          id: number
          import_export: string | null
          lane: string | null
          "line_haul_(so_$)": number | null
          notes: string | null
          outgate_pick_up_city: string | null
          outgate_pick_up_state: string | null
          "pool_chz_accepted_(y_n)": string | null
          "pool_chz_rate_(so_$_day)": string | null
          "private_chz_accepted_(y_n)": string | null
          "private_chz_rate_(so_$)": number | null
          "r_t_(y_n)": string | null
          "s_t_(y_n)": string | null
          ssl: string | null
          "triaxle_chz_rate_(so_$)": number | null
        }
        Insert: {
          agreement_w__ep?: string | null
          agreement_w__ssl?: string | null
          "all_in_rate_(so_$)"?: number | null
          "all_in_rate_(y_n)"?: string | null
          "carrier_chz_rate_(ld__$_day)"?: string | null
          customer?: string | null
          delivery_city?: string | null
          delivery_state?: string | null
          effective_date?: string | null
          ep?: string | null
          "flat_chz_rate_(so_$)"?: number | null
          "flat_chz_rate_(y_n)"?: string | null
          "free_time_(days)"?: number | null
          id?: never
          import_export?: string | null
          lane?: string | null
          "line_haul_(so_$)"?: number | null
          notes?: string | null
          outgate_pick_up_city?: string | null
          outgate_pick_up_state?: string | null
          "pool_chz_accepted_(y_n)"?: string | null
          "pool_chz_rate_(so_$_day)"?: string | null
          "private_chz_accepted_(y_n)"?: string | null
          "private_chz_rate_(so_$)"?: number | null
          "r_t_(y_n)"?: string | null
          "s_t_(y_n)"?: string | null
          ssl?: string | null
          "triaxle_chz_rate_(so_$)"?: number | null
        }
        Update: {
          agreement_w__ep?: string | null
          agreement_w__ssl?: string | null
          "all_in_rate_(so_$)"?: number | null
          "all_in_rate_(y_n)"?: string | null
          "carrier_chz_rate_(ld__$_day)"?: string | null
          customer?: string | null
          delivery_city?: string | null
          delivery_state?: string | null
          effective_date?: string | null
          ep?: string | null
          "flat_chz_rate_(so_$)"?: number | null
          "flat_chz_rate_(y_n)"?: string | null
          "free_time_(days)"?: number | null
          id?: never
          import_export?: string | null
          lane?: string | null
          "line_haul_(so_$)"?: number | null
          notes?: string | null
          outgate_pick_up_city?: string | null
          outgate_pick_up_state?: string | null
          "pool_chz_accepted_(y_n)"?: string | null
          "pool_chz_rate_(so_$_day)"?: string | null
          "private_chz_accepted_(y_n)"?: string | null
          "private_chz_rate_(so_$)"?: number | null
          "r_t_(y_n)"?: string | null
          "s_t_(y_n)"?: string | null
          ssl?: string | null
          "triaxle_chz_rate_(so_$)"?: number | null
        }
        Relationships: []
      }
      stg_patrick_chassis_rate_list: {
        Row: {
          id: number
          provided_by_patrick_march_of_2025: string | null
          "unnamed:_1": string | null
          "unnamed:_2": string | null
          "unnamed:_3": string | null
        }
        Insert: {
          id?: never
          provided_by_patrick_march_of_2025?: string | null
          "unnamed:_1"?: string | null
          "unnamed:_2"?: string | null
          "unnamed:_3"?: string | null
        }
        Update: {
          id?: never
          provided_by_patrick_march_of_2025?: string | null
          "unnamed:_1"?: string | null
          "unnamed:_2"?: string | null
          "unnamed:_3"?: string | null
        }
        Relationships: []
      }
      stg_sheet2: {
        Row: {
          id: number
          "unnamed:_0": string | null
          "unnamed:_1": string | null
          "unnamed:_2": string | null
          "unnamed:_3": string | null
        }
        Insert: {
          id?: never
          "unnamed:_0"?: string | null
          "unnamed:_1"?: string | null
          "unnamed:_2"?: string | null
          "unnamed:_3"?: string | null
        }
        Update: {
          id?: never
          "unnamed:_0"?: string | null
          "unnamed:_1"?: string | null
          "unnamed:_2"?: string | null
          "unnamed:_3"?: string | null
        }
        Relationships: []
      }
      tms_backfill_cfg: {
        Row: {
          chassis_col: string | null
          container_col: string | null
          start_cols: string[] | null
          table_name: string
        }
        Insert: {
          chassis_col?: string | null
          container_col?: string | null
          start_cols?: string[] | null
          table_name: string
        }
        Update: {
          chassis_col?: string | null
          container_col?: string | null
          start_cols?: string[] | null
          table_name?: string
        }
        Relationships: []
      }
      tms_chassis_usage: {
        Row: {
          actual_rc_date: string | null
          actual_ship: string | null
          charge_code: string | null
          chassis_number: string
          container_number: string | null
          id: string
          loaded_at: string
          quantity: number | null
          rc_use_days: number | null
          ship_use_days: number | null
          source_file: string | null
          total_use_days: number | null
        }
        Insert: {
          actual_rc_date?: string | null
          actual_ship?: string | null
          charge_code?: string | null
          chassis_number: string
          container_number?: string | null
          id?: string
          loaded_at?: string
          quantity?: number | null
          rc_use_days?: number | null
          ship_use_days?: number | null
          source_file?: string | null
          total_use_days?: number | null
        }
        Update: {
          actual_rc_date?: string | null
          actual_ship?: string | null
          charge_code?: string | null
          chassis_number?: string
          container_number?: string | null
          id?: string
          loaded_at?: string
          quantity?: number | null
          rc_use_days?: number | null
          ship_use_days?: number | null
          source_file?: string | null
          total_use_days?: number | null
        }
        Relationships: []
      }
      tms_mg_curr: {
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
          movement_start_date: string | null
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
          movement_start_date?: string | null
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
          movement_start_date?: string | null
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
      tms_mg_hist: {
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
          movement_start_date: string | null
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
          movement_start_date?: string | null
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
          movement_start_date?: string | null
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
      yards: {
        Row: {
          city: string | null
          code: string | null
          geom: unknown
          id: string
          name: string
          state: string | null
        }
        Insert: {
          city?: string | null
          code?: string | null
          geom?: unknown
          id?: string
          name: string
          state?: string | null
        }
        Update: {
          city?: string | null
          code?: string | null
          geom?: unknown
          id?: string
          name?: string
          state?: string | null
        }
        Relationships: []
      }
      ytd_loads: {
        Row: {
          acct_mg_name: string | null
          actual_rc_date: string | null
          available_at_port_date: string | null
          carrier_invoice_charge: number | null
          carrier_invoice_date: string | null
          carrier_invoice_num: string | null
          carrier_name: string | null
          carrier_rate_charge: number | null
          carrier_scac_code: string | null
          carrier_total_accessorials_rate: number | null
          carrier_total_invoice_detention: number | null
          carrier_total_invoice_fuel: number | null
          carrier_total_invoice_linehaul: string | null
          carrier_total_invoice_other: string | null
          carrier_total_rate_detention: number | null
          carrier_total_rate_fuel: number | null
          carrier_total_rate_linehaul: number | null
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
          cust_invoice_charge: number | null
          cust_invoice_date: string | null
          cust_invoice_num: string | null
          cust_rate_charge: number | null
          cust_total_invoice_detention: number | null
          cust_total_invoice_fuel: number | null
          cust_total_invoice_linehaul: number | null
          cust_total_invoice_other: number | null
          cust_total_rate_detention: number | null
          cust_total_rate_fuel: number | null
          cust_total_rate_linehaul: number | null
          customer_account_number: string | null
          customer_invoice_requested_date: string | null
          customer_name: string | null
          customer_reference_number: string | null
          customer_total_accessorials_rate: number | null
          customer_total_invoice_accessorials: number | null
          cycle_create_tendered: number | null
          cycle_delivery_custinvreq: number | null
          cycle_delivery_pod: number | null
          cycle_delivery_rc: number | null
          cycle_pickup_delivery: number | null
          cycle_tendered_pickup: number | null
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
          dotnumber: number | null
          dropandpull: string | null
          empty_pickup_date: string | null
          entreprise_num: string | null
          future_actual_delivery: number | null
          future_custinvreqdate: number | null
          future_pod_date: number | null
          future_rc_date: number | null
          id: number | null
          isemptyatyard: string | null
          isemptycontainerpickup: string | null
          item_description: string | null
          last_free_date: string | null
          ld_num: string | null
          ld_num_format: string | null
          load_complexity: string | null
          masterbolkey: number | null
          mbl: string | null
          mbl_format: string | null
          mcnumber: number | null
          miles: number | null
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
          quantity: number | null
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
          source_file_key: number | null
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
          weight: number | null
          zero_rev: string | null
        }
        Insert: {
          acct_mg_name?: string | null
          actual_rc_date?: string | null
          available_at_port_date?: string | null
          carrier_invoice_charge?: number | null
          carrier_invoice_date?: string | null
          carrier_invoice_num?: string | null
          carrier_name?: string | null
          carrier_rate_charge?: number | null
          carrier_scac_code?: string | null
          carrier_total_accessorials_rate?: number | null
          carrier_total_invoice_detention?: number | null
          carrier_total_invoice_fuel?: number | null
          carrier_total_invoice_linehaul?: string | null
          carrier_total_invoice_other?: string | null
          carrier_total_rate_detention?: number | null
          carrier_total_rate_fuel?: number | null
          carrier_total_rate_linehaul?: number | null
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
          cust_invoice_charge?: number | null
          cust_invoice_date?: string | null
          cust_invoice_num?: string | null
          cust_rate_charge?: number | null
          cust_total_invoice_detention?: number | null
          cust_total_invoice_fuel?: number | null
          cust_total_invoice_linehaul?: number | null
          cust_total_invoice_other?: number | null
          cust_total_rate_detention?: number | null
          cust_total_rate_fuel?: number | null
          cust_total_rate_linehaul?: number | null
          customer_account_number?: string | null
          customer_invoice_requested_date?: string | null
          customer_name?: string | null
          customer_reference_number?: string | null
          customer_total_accessorials_rate?: number | null
          customer_total_invoice_accessorials?: number | null
          cycle_create_tendered?: number | null
          cycle_delivery_custinvreq?: number | null
          cycle_delivery_pod?: number | null
          cycle_delivery_rc?: number | null
          cycle_pickup_delivery?: number | null
          cycle_tendered_pickup?: number | null
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
          dotnumber?: number | null
          dropandpull?: string | null
          empty_pickup_date?: string | null
          entreprise_num?: string | null
          future_actual_delivery?: number | null
          future_custinvreqdate?: number | null
          future_pod_date?: number | null
          future_rc_date?: number | null
          id?: number | null
          isemptyatyard?: string | null
          isemptycontainerpickup?: string | null
          item_description?: string | null
          last_free_date?: string | null
          ld_num?: string | null
          ld_num_format?: string | null
          load_complexity?: string | null
          masterbolkey?: number | null
          mbl?: string | null
          mbl_format?: string | null
          mcnumber?: number | null
          miles?: number | null
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
          quantity?: number | null
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
          source_file_key?: number | null
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
          weight?: number | null
          zero_rev?: string | null
        }
        Update: {
          acct_mg_name?: string | null
          actual_rc_date?: string | null
          available_at_port_date?: string | null
          carrier_invoice_charge?: number | null
          carrier_invoice_date?: string | null
          carrier_invoice_num?: string | null
          carrier_name?: string | null
          carrier_rate_charge?: number | null
          carrier_scac_code?: string | null
          carrier_total_accessorials_rate?: number | null
          carrier_total_invoice_detention?: number | null
          carrier_total_invoice_fuel?: number | null
          carrier_total_invoice_linehaul?: string | null
          carrier_total_invoice_other?: string | null
          carrier_total_rate_detention?: number | null
          carrier_total_rate_fuel?: number | null
          carrier_total_rate_linehaul?: number | null
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
          cust_invoice_charge?: number | null
          cust_invoice_date?: string | null
          cust_invoice_num?: string | null
          cust_rate_charge?: number | null
          cust_total_invoice_detention?: number | null
          cust_total_invoice_fuel?: number | null
          cust_total_invoice_linehaul?: number | null
          cust_total_invoice_other?: number | null
          cust_total_rate_detention?: number | null
          cust_total_rate_fuel?: number | null
          cust_total_rate_linehaul?: number | null
          customer_account_number?: string | null
          customer_invoice_requested_date?: string | null
          customer_name?: string | null
          customer_reference_number?: string | null
          customer_total_accessorials_rate?: number | null
          customer_total_invoice_accessorials?: number | null
          cycle_create_tendered?: number | null
          cycle_delivery_custinvreq?: number | null
          cycle_delivery_pod?: number | null
          cycle_delivery_rc?: number | null
          cycle_pickup_delivery?: number | null
          cycle_tendered_pickup?: number | null
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
          dotnumber?: number | null
          dropandpull?: string | null
          empty_pickup_date?: string | null
          entreprise_num?: string | null
          future_actual_delivery?: number | null
          future_custinvreqdate?: number | null
          future_pod_date?: number | null
          future_rc_date?: number | null
          id?: number | null
          isemptyatyard?: string | null
          isemptycontainerpickup?: string | null
          item_description?: string | null
          last_free_date?: string | null
          ld_num?: string | null
          ld_num_format?: string | null
          load_complexity?: string | null
          masterbolkey?: number | null
          mbl?: string | null
          mbl_format?: string | null
          mcnumber?: number | null
          miles?: number | null
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
          quantity?: number | null
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
          source_file_key?: number | null
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
          weight?: number | null
          zero_rev?: string | null
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
      mv_chassis_utilization_monthly: {
        Row: {
          calc_days_only_for_month: number | null
          chassis_number: string | null
          days_in_month: number | null
          month_ym: string | null
          total_use_days_for_month: number | null
          util_pct_total_use_days: number | null
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
          movement_start_date: string | null
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
        Relationships: []
      }
      tms_mg_proj_curr: {
        Row: {
          canonical_charge: string | null
          charge_text: string | null
          chassis_norm: string | null
          container_norm: string | null
          drange: unknown
          pickup_date: string | null
          return_date: string | null
        }
        Relationships: []
      }
      v_invoice_line_checks: {
        Row: {
          billed_days: number | null
          chassis_match: boolean | null
          chassis_norm: string | null
          container_match: boolean | null
          container_norm: string | null
          customer_name: string | null
          date_sane: boolean | null
          dr: unknown
          dup_move_exact: boolean | null
          dup_move_partial: boolean | null
          exact_pickup_date_match: boolean | null
          exact_return_date_match: boolean | null
          has_contract: boolean | null
          invoice_amt: number | null
          invoice_consistent: boolean | null
          invoice_id: string | null
          invoice_line_id: number | null
          invoice_qty: number | null
          invoice_rate: number | null
          invoice_used_days: number | null
          off_hire_date: string | null
          on_hire_date: string | null
          rated_amt: number | null
          rated_consistent: boolean | null
          rated_qty: number | null
          rated_rate: number | null
          scac_misuse: boolean | null
          ssl: string | null
          tms_candidates: Json | null
          tms_overlap_count: number | null
          tms_pickup_date: string | null
          tms_return_date: string | null
          tms_used_days: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dcli_invoice_line_staging_staging_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "dcli_invoice_staging"
            referencedColumns: ["id"]
          },
        ]
      }
      v_invoice_line_enriched: {
        Row: {
          chassis_norm: string | null
          container_norm: string | null
          customer_name: string | null
          invoice_amt: number | null
          invoice_id: string | null
          invoice_line_id: number | null
          invoice_qty: number | null
          invoice_rate: number | null
          off_hire_date: string | null
          on_hire_date: string | null
          rated_amt: number | null
          rated_qty: number | null
          rated_rate: number | null
          ssl: string | null
          tms_candidates: Json | null
          tms_overlap_count: number | null
          tms_pickup_date: string | null
          tms_return_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dcli_invoice_line_staging_staging_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "dcli_invoice_staging"
            referencedColumns: ["id"]
          },
        ]
      }
      v_invoice_line_verdict: {
        Row: {
          chassis_norm: string | null
          checks: Json | null
          confidence_score: number | null
          container_norm: string | null
          invoice_id: string | null
          invoice_line_id: number | null
          off_hire_date: string | null
          on_hire_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dcli_invoice_line_staging_staging_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "dcli_invoice_staging"
            referencedColumns: ["id"]
          },
        ]
      }
      ytd_mg_tms_monthly: {
        Row: {
          deliveries: number | null
          month: string | null
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
      approve_dcli_invoice_staging: {
        Args: { p_staging_id: string }
        Returns: Json
      }
      backfill_movement_start_date_executor: {
        Args: {
          p_any_not_null_expr: string
          p_batch_size: number
          p_coalesce_expr: string
          p_table: unknown
        }
        Returns: number
      }
      bytea_to_text: { Args: { data: string }; Returns: string }
      days_inclusive: { Args: { a: string; b: string }; Returns: number }
      dblink: { Args: { "": string }; Returns: Record<string, unknown>[] }
      dblink_cancel_query: { Args: { "": string }; Returns: string }
      dblink_close: { Args: { "": string }; Returns: string }
      dblink_connect: { Args: { "": string }; Returns: string }
      dblink_connect_u: { Args: { "": string }; Returns: string }
      dblink_current_query: { Args: never; Returns: string }
      dblink_disconnect:
        | { Args: { "": string }; Returns: string }
        | { Args: never; Returns: string }
      dblink_error_message: { Args: { "": string }; Returns: string }
      dblink_exec: { Args: { "": string }; Returns: string }
      dblink_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      dblink_get_connections: { Args: never; Returns: string[] }
      dblink_get_notify:
        | { Args: never; Returns: Record<string, unknown>[] }
        | { Args: { conname: string }; Returns: Record<string, unknown>[] }
      dblink_get_pkey: {
        Args: { "": string }
        Returns: Database["public"]["CompositeTypes"]["dblink_pkey_results"][]
        SetofOptions: {
          from: "*"
          to: "dblink_pkey_results"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      dblink_get_result: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      dblink_is_busy: { Args: { "": string }; Returns: number }
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
      fn_add_invoice_comment: {
        Args: {
          p_comment: string
          p_invoice_line_id: number
          p_user_email?: string
        }
        Returns: undefined
      }
      fn_record_invoice_action: {
        Args: {
          p_action: string
          p_delta: number
          p_invoice_line_id: number
          p_reason: string
        }
        Returns: undefined
      }
      fn_tms_candidates_json: {
        Args: { p_chassis: string; p_offhire: string; p_onhire: string }
        Returns: Json
      }
      fn_tms_overlap_count: {
        Args: { p_chassis: string; p_offhire: string; p_onhire: string }
        Returns: number
      }
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
      load_fact_chassis_rate_terms: { Args: never; Returns: undefined }
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
      month_overlap_days: {
        Args: { month_ym: string; rc: string; ship: string }
        Returns: number
      }
      norm: { Args: { v: string }; Returns: string }
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
      run_backfill_loop: { Args: never; Returns: number }
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
      tms_mg_monthly_archive: { Args: never; Returns: undefined }
      try_date: { Args: { p: string }; Returns: string }
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
      upsert_vendor: { Args: { vendor: string }; Returns: number }
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
      util_to_bigint: { Args: { p_text: string }; Returns: number }
      util_to_bool: { Args: { p_text: string }; Returns: boolean }
      util_to_numeric: { Args: { p_text: string }; Returns: number }
      util_try_bool: { Args: { p_text: string }; Returns: boolean }
      util_try_numeric: { Args: { p_text: string }; Returns: number }
      util_try_timestamptz: { Args: { p_text: string }; Returns: string }
      validate_dcli_invoice_staging: {
        Args: { p_staging_id: string }
        Returns: Json
      }
    }
    Enums: {
      chassis_state:
        | "in_use"
        | "idle_parked"
        | "shop"
        | "transit_empty"
        | "in_pool"
        | "lost"
        | "oos"
      hold_reason:
        | "legal"
        | "billing"
        | "safety"
        | "maintenance"
        | "inventory"
        | "other"
      inspection_type: "DVIR" | "Periodic" | "DOT" | "Other"
      liability_party:
        | "unknown"
        | "carrier"
        | "customer"
        | "vendor"
        | "3rd_party"
        | "self"
      pass_fail: "pass" | "fail"
      severity: "low" | "medium" | "high" | "critical"
      wo_status:
        | "open"
        | "in_progress"
        | "waiting_parts"
        | "complete"
        | "cancelled"
    }
    CompositeTypes: {
      dblink_pkey_results: {
        position: number | null
        colname: string | null
      }
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
    Enums: {
      chassis_state: [
        "in_use",
        "idle_parked",
        "shop",
        "transit_empty",
        "in_pool",
        "lost",
        "oos",
      ],
      hold_reason: [
        "legal",
        "billing",
        "safety",
        "maintenance",
        "inventory",
        "other",
      ],
      inspection_type: ["DVIR", "Periodic", "DOT", "Other"],
      liability_party: [
        "unknown",
        "carrier",
        "customer",
        "vendor",
        "3rd_party",
        "self",
      ],
      pass_fail: ["pass", "fail"],
      severity: ["low", "medium", "high", "critical"],
      wo_status: [
        "open",
        "in_progress",
        "waiting_parts",
        "complete",
        "cancelled",
      ],
    },
  },
} as const
