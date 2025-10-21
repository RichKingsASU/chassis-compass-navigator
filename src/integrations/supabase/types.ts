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
      asset_locations: {
        Row: {
          altitude_m: number | null
          asset_id: string
          contents: boolean | null
          contents_percentage: number | null
          created_at: string
          door_open: boolean | null
          hdop: number | null
          humidity_pct: number | null
          id: number
          location: unknown
          normalized_address: string | null
          org_id: string
          place_id: string | null
          pressure_pa: number | null
          raw: Json | null
          recorded_at: string
          source: string | null
          temperature_c: number | null
          velocity_cms: number | null
        }
        Insert: {
          altitude_m?: number | null
          asset_id: string
          contents?: boolean | null
          contents_percentage?: number | null
          created_at?: string
          door_open?: boolean | null
          hdop?: number | null
          humidity_pct?: number | null
          id?: number
          location: unknown
          normalized_address?: string | null
          org_id: string
          place_id?: string | null
          pressure_pa?: number | null
          raw?: Json | null
          recorded_at: string
          source?: string | null
          temperature_c?: number | null
          velocity_cms?: number | null
        }
        Update: {
          altitude_m?: number | null
          asset_id?: string
          contents?: boolean | null
          contents_percentage?: number | null
          created_at?: string
          door_open?: boolean | null
          hdop?: number | null
          humidity_pct?: number | null
          id?: number
          location?: unknown
          normalized_address?: string | null
          org_id?: string
          place_id?: string | null
          pressure_pa?: number | null
          raw?: Json | null
          recorded_at?: string
          source?: string | null
          temperature_c?: number | null
          velocity_cms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_locations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_class: string | null
          created_at: string
          door_type: string | null
          height: number | null
          id: string
          identifier: string | null
          length: number | null
          org_id: string
          radar_asset_id: string | null
          type: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          asset_class?: string | null
          created_at?: string
          door_type?: string | null
          height?: number | null
          id?: string
          identifier?: string | null
          length?: number | null
          org_id: string
          radar_asset_id?: string | null
          type?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          asset_class?: string | null
          created_at?: string
          door_type?: string | null
          height?: number | null
          id?: string
          identifier?: string | null
          length?: number | null
          org_id?: string
          radar_asset_id?: string | null
          type?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      blackberry_device_map: {
        Row: {
          asset_id: string
          created_at: string
          external_device_id: string
          org_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          external_device_id: string
          org_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          external_device_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blackberry_device_map_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
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
          updated_at: string
          validated: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          row_data: Json
          sheet_name: string
          updated_at?: string
          validated?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          row_data?: Json
          sheet_name?: string
          updated_at?: string
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
      chat_events: {
        Row: {
          created_at: string
          id: number
          k: number | null
          latency_ms: number | null
          org_id: string
          query: string
          top_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          k?: number | null
          latency_ms?: number | null
          org_id: string
          query: string
          top_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          k?: number | null
          latency_ms?: number | null
          org_id?: string
          query?: string
          top_score?: number | null
          user_id?: string
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
      dcli_invoice: {
        Row: {
          amount: number
          description: string
          disputed: boolean | null
          disputed_amount: number | null
          due_date: string
          invoice_date: string
          invoice_id: string
          status: string
        }
        Insert: {
          amount: number
          description: string
          disputed?: boolean | null
          disputed_amount?: number | null
          due_date: string
          invoice_date: string
          invoice_id: string
          status: string
        }
        Update: {
          amount?: number
          description?: string
          disputed?: boolean | null
          disputed_amount?: number | null
          due_date?: string
          invoice_date?: string
          invoice_id?: string
          status?: string
        }
        Relationships: []
      }
      dcli_invoice_line_item: {
        Row: {
          attachment_count: number
          attachments: Json
          bill_end_date: string | null
          bill_start_date: string | null
          billing_date: string | null
          billing_terms: string | null
          charge_description: string | null
          chassis: string | null
          chassis_norm: string | null
          corporate_account: string | null
          corporate_name: string | null
          created_at: string
          customer_name: string | null
          customer_number: string | null
          dispute_status: string | null
          due_date: string | null
          grand_total: number | null
          haulage_type: string | null
          in_gate_fees: number | null
          invoice_status: string
          invoice_total: number
          invoice_type: string
          line_invoice_number: string
          ocean_carrier_scac: string | null
          off_container_norm: string | null
          off_hire_bol: string | null
          off_hire_booking_no: string | null
          off_hire_container: string | null
          off_hire_date: string | null
          off_hire_location: string | null
          off_hire_mc_scac: string | null
          off_hire_partner_code: string | null
          off_hire_status: string | null
          on_container_norm: string | null
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
          remaining_balance: number
          subtotal: number | null
          summary_invoice_id: string
          tax_amount: number | null
          tax_rate_pct: number | null
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
          updated_at: string
        }
        Insert: {
          attachment_count?: number
          attachments?: Json
          bill_end_date?: string | null
          bill_start_date?: string | null
          billing_date?: string | null
          billing_terms?: string | null
          charge_description?: string | null
          chassis?: string | null
          chassis_norm?: string | null
          corporate_account?: string | null
          corporate_name?: string | null
          created_at?: string
          customer_name?: string | null
          customer_number?: string | null
          dispute_status?: string | null
          due_date?: string | null
          grand_total?: number | null
          haulage_type?: string | null
          in_gate_fees?: number | null
          invoice_status: string
          invoice_total: number
          invoice_type: string
          line_invoice_number: string
          ocean_carrier_scac?: string | null
          off_container_norm?: string | null
          off_hire_bol?: string | null
          off_hire_booking_no?: string | null
          off_hire_container?: string | null
          off_hire_date?: string | null
          off_hire_location?: string | null
          off_hire_mc_scac?: string | null
          off_hire_partner_code?: string | null
          off_hire_status?: string | null
          on_container_norm?: string | null
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
          remaining_balance?: number
          subtotal?: number | null
          summary_invoice_id: string
          tax_amount?: number | null
          tax_rate_pct?: number | null
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
          updated_at?: string
        }
        Update: {
          attachment_count?: number
          attachments?: Json
          bill_end_date?: string | null
          bill_start_date?: string | null
          billing_date?: string | null
          billing_terms?: string | null
          charge_description?: string | null
          chassis?: string | null
          chassis_norm?: string | null
          corporate_account?: string | null
          corporate_name?: string | null
          created_at?: string
          customer_name?: string | null
          customer_number?: string | null
          dispute_status?: string | null
          due_date?: string | null
          grand_total?: number | null
          haulage_type?: string | null
          in_gate_fees?: number | null
          invoice_status?: string
          invoice_total?: number
          invoice_type?: string
          line_invoice_number?: string
          ocean_carrier_scac?: string | null
          off_container_norm?: string | null
          off_hire_bol?: string | null
          off_hire_booking_no?: string | null
          off_hire_container?: string | null
          off_hire_date?: string | null
          off_hire_location?: string | null
          off_hire_mc_scac?: string | null
          off_hire_partner_code?: string | null
          off_hire_status?: string | null
          on_container_norm?: string | null
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
          remaining_balance?: number
          subtotal?: number | null
          summary_invoice_id?: string
          tax_amount?: number | null
          tax_rate_pct?: number | null
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
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dcli_invoice_line_item_summary_invoice_id_fkey"
            columns: ["summary_invoice_id"]
            isOneToOne: false
            referencedRelation: "dcli_invoice"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      dcli_invoice_staging: {
        Row: {
          account_code: string | null
          attachments: Json | null
          billing_date: string | null
          created_at: string
          currency: string | null
          due_date: string | null
          excel_headers: Json | null
          id: string
          invoice_date: string | null
          line_items: Json
          status: string | null
          summary_invoice_id: string
          total_amount: number | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          account_code?: string | null
          attachments?: Json | null
          billing_date?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          excel_headers?: Json | null
          id?: string
          invoice_date?: string | null
          line_items?: Json
          status?: string | null
          summary_invoice_id: string
          total_amount?: number | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          account_code?: string | null
          attachments?: Json | null
          billing_date?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          excel_headers?: Json | null
          id?: string
          invoice_date?: string | null
          line_items?: Json
          status?: string | null
          summary_invoice_id?: string
          total_amount?: number | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          id: string
          key: string
          org_id: string
          role: string | null
          role_key: string | null
          scope: string
          updated_at: string
          user_id: string | null
          user_key: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          org_id: string
          role?: string | null
          role_key?: string | null
          scope?: string
          updated_at?: string
          user_id?: string | null
          user_key?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          org_id?: string
          role?: string | null
          role_key?: string | null
          scope?: string
          updated_at?: string
          user_id?: string | null
          user_key?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
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
      gps_data: {
        Row: {
          altitude: number | null
          battery_level: number | null
          created_at: string | null
          device_id: string | null
          heading: number | null
          id: string
          latitude: number | null
          longitude: number | null
          provider: string
          raw_data: Json | null
          recorded_at: string | null
          speed: number | null
          upload_id: string | null
        }
        Insert: {
          altitude?: number | null
          battery_level?: number | null
          created_at?: string | null
          device_id?: string | null
          heading?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider: string
          raw_data?: Json | null
          recorded_at?: string | null
          speed?: number | null
          upload_id?: string | null
        }
        Update: {
          altitude?: number | null
          battery_level?: number | null
          created_at?: string | null
          device_id?: string | null
          heading?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider?: string
          raw_data?: Json | null
          recorded_at?: string | null
          speed?: number | null
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gps_data_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "gps_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_uploads: {
        Row: {
          created_at: string | null
          data_date: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          notes: string | null
          provider: string
          row_count: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_date: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          notes?: string | null
          provider: string
          row_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_date?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          notes?: string | null
          provider?: string
          row_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ingest_cursors: {
        Row: {
          last_synced_at: string | null
          org_id: string
          source: string
          source_id: string
        }
        Insert: {
          last_synced_at?: string | null
          org_id: string
          source: string
          source_id: string
        }
        Update: {
          last_synced_at?: string | null
          org_id?: string
          source?: string
          source_id?: string
        }
        Relationships: []
      }
      invoice_lines: {
        Row: {
          created_at: string
          dispute_history: Json | null
          dispute_status: string | null
          exact_match: boolean | null
          id: string
          invoice_number: string
          line_number: number
          match_score: number | null
          mismatch_reasons: Json | null
          notes: string | null
          status: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          dispute_history?: Json | null
          dispute_status?: string | null
          exact_match?: boolean | null
          id?: string
          invoice_number: string
          line_number: number
          match_score?: number | null
          mismatch_reasons?: Json | null
          notes?: string | null
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          dispute_history?: Json | null
          dispute_status?: string | null
          exact_match?: boolean | null
          id?: string
          invoice_number?: string
          line_number?: number
          match_score?: number | null
          mismatch_reasons?: Json | null
          notes?: string | null
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          description: string
          disputed: boolean | null
          disputed_amount: number | null
          due_date: string
          invoice_date: string
          invoice_id: string
          status: string
        }
        Insert: {
          amount: number
          description: string
          disputed?: boolean | null
          disputed_amount?: number | null
          due_date: string
          invoice_date: string
          invoice_id: string
          status: string
        }
        Update: {
          amount?: number
          description?: string
          disputed?: boolean | null
          disputed_amount?: number | null
          due_date?: string
          invoice_date?: string
          invoice_id?: string
          status?: string
        }
        Relationships: []
      }
      invoices_header: {
        Row: {
          created_at: string | null
          currency: string | null
          due_date: string | null
          gemini_raw: Json | null
          id: string
          invoice_date: string | null
          invoice_id: string
          source_csv_path: string
          source_pdf_path: string
          status: string | null
          total_amount_due: number | null
          vendor: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          gemini_raw?: Json | null
          id?: string
          invoice_date?: string | null
          invoice_id: string
          source_csv_path: string
          source_pdf_path: string
          status?: string | null
          total_amount_due?: number | null
          vendor?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          gemini_raw?: Json | null
          id?: string
          invoice_date?: string | null
          invoice_id?: string
          source_csv_path?: string
          source_pdf_path?: string
          status?: string | null
          total_amount_due?: number | null
          vendor?: string | null
        }
        Relationships: []
      }
      invoices_line_items: {
        Row: {
          created_at: string | null
          description: string | null
          extra: Json | null
          id: string
          invoice_id: string
          line_no: number | null
          quantity: number | null
          total_charge: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          extra?: Json | null
          id?: string
          invoice_id: string
          line_no?: number | null
          quantity?: number | null
          total_charge?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          extra?: Json | null
          id?: string
          invoice_id?: string
          line_no?: number | null
          quantity?: number | null
          total_charge?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_header"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoices_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_totals"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      mcl_forrest_ltl_owned: {
        Row: {
          anytrek_unit: number | null
          auto_renew_1_end_date: string | null
          auto_renew_1_start_date: string | null
          auto_renew_2_end_date: string | null
          auto_renew_2_start_date: string | null
          charge_code_in_mg: string | null
          chassis_category: string | null
          chassis_reporting_category: string | null
          chassis_status: string | null
          contract: string | null
          contract_status: string | null
          current_lease_term: string | null
          current_rate_per_day: number | null
          date_last_contract_rcvd_signed: string | null
          day_notice_of_lease_expiration: string | null
          description: string | null
          extended_gps_rate_per_day: number | null
          extended_lease_end: string | null
          extended_lease_rate_per_day: number | null
          extended_lease_start: string | null
          extended_total_per_day_2: number | null
          forrest_chassis_type: string | null
          forrest_chz: string | null
          forrest_off_hire_date: string | null
          forrest_on_hire_date: string | null
          gps_provider: string | null
          hard_gps: string | null
          id: number
          initial_gps_rate_per_day: number | null
          initial_lease_end_date: string | null
          initial_lease_rate_per_day: number | null
          initial_lease_start_date: string | null
          initial_lease_term: string | null
          initial_total_per_day_1: number | null
          lessor: string | null
          mfr: string | null
          model_year: string | null
          month_chassis_acquired: string | null
          month_chassis_off_hired: string | null
          notes: string | null
          old_chz: string | null
          original_stated_value: number | null
          pick_up_handling_fee: number | null
          pick_up_location: string | null
          plate_nbr: string | null
          plate_state: string | null
          region: string | null
          return_handling_fee: number | null
          serial: string | null
          tare_weight: string | null
          under_frqt_in_gier: boolean | null
          week_chassis_acquired: string | null
          week_chassis_off_hired: string | null
        }
        Insert: {
          anytrek_unit?: number | null
          auto_renew_1_end_date?: string | null
          auto_renew_1_start_date?: string | null
          auto_renew_2_end_date?: string | null
          auto_renew_2_start_date?: string | null
          charge_code_in_mg?: string | null
          chassis_category?: string | null
          chassis_reporting_category?: string | null
          chassis_status?: string | null
          contract?: string | null
          contract_status?: string | null
          current_lease_term?: string | null
          current_rate_per_day?: number | null
          date_last_contract_rcvd_signed?: string | null
          day_notice_of_lease_expiration?: string | null
          description?: string | null
          extended_gps_rate_per_day?: number | null
          extended_lease_end?: string | null
          extended_lease_rate_per_day?: number | null
          extended_lease_start?: string | null
          extended_total_per_day_2?: number | null
          forrest_chassis_type?: string | null
          forrest_chz?: string | null
          forrest_off_hire_date?: string | null
          forrest_on_hire_date?: string | null
          gps_provider?: string | null
          hard_gps?: string | null
          id?: number
          initial_gps_rate_per_day?: number | null
          initial_lease_end_date?: string | null
          initial_lease_rate_per_day?: number | null
          initial_lease_start_date?: string | null
          initial_lease_term?: string | null
          initial_total_per_day_1?: number | null
          lessor?: string | null
          mfr?: string | null
          model_year?: string | null
          month_chassis_acquired?: string | null
          month_chassis_off_hired?: string | null
          notes?: string | null
          old_chz?: string | null
          original_stated_value?: number | null
          pick_up_handling_fee?: number | null
          pick_up_location?: string | null
          plate_nbr?: string | null
          plate_state?: string | null
          region?: string | null
          return_handling_fee?: number | null
          serial?: string | null
          tare_weight?: string | null
          under_frqt_in_gier?: boolean | null
          week_chassis_acquired?: string | null
          week_chassis_off_hired?: string | null
        }
        Update: {
          anytrek_unit?: number | null
          auto_renew_1_end_date?: string | null
          auto_renew_1_start_date?: string | null
          auto_renew_2_end_date?: string | null
          auto_renew_2_start_date?: string | null
          charge_code_in_mg?: string | null
          chassis_category?: string | null
          chassis_reporting_category?: string | null
          chassis_status?: string | null
          contract?: string | null
          contract_status?: string | null
          current_lease_term?: string | null
          current_rate_per_day?: number | null
          date_last_contract_rcvd_signed?: string | null
          day_notice_of_lease_expiration?: string | null
          description?: string | null
          extended_gps_rate_per_day?: number | null
          extended_lease_end?: string | null
          extended_lease_rate_per_day?: number | null
          extended_lease_start?: string | null
          extended_total_per_day_2?: number | null
          forrest_chassis_type?: string | null
          forrest_chz?: string | null
          forrest_off_hire_date?: string | null
          forrest_on_hire_date?: string | null
          gps_provider?: string | null
          hard_gps?: string | null
          id?: number
          initial_gps_rate_per_day?: number | null
          initial_lease_end_date?: string | null
          initial_lease_rate_per_day?: number | null
          initial_lease_start_date?: string | null
          initial_lease_term?: string | null
          initial_total_per_day_1?: number | null
          lessor?: string | null
          mfr?: string | null
          model_year?: string | null
          month_chassis_acquired?: string | null
          month_chassis_off_hired?: string | null
          notes?: string | null
          old_chz?: string | null
          original_stated_value?: number | null
          pick_up_handling_fee?: number | null
          pick_up_location?: string | null
          plate_nbr?: string | null
          plate_state?: string | null
          region?: string | null
          return_handling_fee?: number | null
          serial?: string | null
          tare_weight?: string | null
          under_frqt_in_gier?: boolean | null
          week_chassis_acquired?: string | null
          week_chassis_off_hired?: string | null
        }
        Relationships: []
      }
      mcl_forrest_stl: {
        Row: {
          all_units_on_hired_june_2024_present: string | null
          booking: string | null
          days_out: number | null
          id: number
          location: string | null
          notes: string | null
          off_hire_date: string | null
          on_hire_date: string | null
          paid_amount_w_tax: number | null
          rate_per_day: number | null
          repair_costs_billed_by_milestone: number | null
          size_type: string | null
          total_repair_costs_forrest: boolean | null
          year_wk_offhire: string | null
          year_wk_onhire: string | null
        }
        Insert: {
          all_units_on_hired_june_2024_present?: string | null
          booking?: string | null
          days_out?: number | null
          id?: number
          location?: string | null
          notes?: string | null
          off_hire_date?: string | null
          on_hire_date?: string | null
          paid_amount_w_tax?: number | null
          rate_per_day?: number | null
          repair_costs_billed_by_milestone?: number | null
          size_type?: string | null
          total_repair_costs_forrest?: boolean | null
          year_wk_offhire?: string | null
          year_wk_onhire?: string | null
        }
        Update: {
          all_units_on_hired_june_2024_present?: string | null
          booking?: string | null
          days_out?: number | null
          id?: number
          location?: string | null
          notes?: string | null
          off_hire_date?: string | null
          on_hire_date?: string | null
          paid_amount_w_tax?: number | null
          rate_per_day?: number | null
          repair_costs_billed_by_milestone?: number | null
          size_type?: string | null
          total_repair_costs_forrest?: boolean | null
          year_wk_offhire?: string | null
          year_wk_onhire?: string | null
        }
        Relationships: []
      }
      mcl_master_chassis_list: {
        Row: {
          charge_code_in_mg: string | null
          chassis_category: string | null
          chassis_status: string | null
          contract: string | null
          daily_rate: number | null
          forrest_chassis_type: string | null
          forrest_chz: string | null
          id: number
          lessor: string | null
          plate_nbr: string | null
          plate_state: string | null
          region: string | null
          serial: string | null
        }
        Insert: {
          charge_code_in_mg?: string | null
          chassis_category?: string | null
          chassis_status?: string | null
          contract?: string | null
          daily_rate?: number | null
          forrest_chassis_type?: string | null
          forrest_chz?: string | null
          id?: number
          lessor?: string | null
          plate_nbr?: string | null
          plate_state?: string | null
          region?: string | null
          serial?: string | null
        }
        Update: {
          charge_code_in_mg?: string | null
          chassis_category?: string | null
          chassis_status?: string | null
          contract?: string | null
          daily_rate?: number | null
          forrest_chassis_type?: string | null
          forrest_chz?: string | null
          id?: number
          lessor?: string | null
          plate_nbr?: string | null
          plate_state?: string | null
          region?: string | null
          serial?: string | null
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
          chassis_norm: string | null
          chassis_number: string | null
          chassis_number_format: string | null
          chassis_type: string | null
          container_at_port: string | null
          container_norm: string | null
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
          chassis_norm?: string | null
          chassis_number?: string | null
          chassis_number_format?: string | null
          chassis_type?: string | null
          container_at_port?: string | null
          container_norm?: string | null
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
          chassis_norm?: string | null
          chassis_number?: string | null
          chassis_number_format?: string | null
          chassis_type?: string | null
          container_at_port?: string | null
          container_norm?: string | null
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
      org_integrations: {
        Row: {
          options: Json
          org_id: string
          provider_key: string
        }
        Insert: {
          options?: Json
          org_id: string
          provider_key: string
        }
        Update: {
          options?: Json
          org_id?: string
          provider_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
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
      provider_config: {
        Row: {
          options: Json
          org_id: string
          provider_key: string
          updated_at: string
        }
        Insert: {
          options?: Json
          org_id: string
          provider_key: string
          updated_at?: string
        }
        Update: {
          options?: Json
          org_id?: string
          provider_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_documents: {
        Row: {
          content: string
          content_hash: string | null
          created_at: string
          embedded_at: string | null
          embedding: string | null
          embedding_vec: string | null
          id: string
          metadata: Json
          org_id: string
          source_pk: string | null
          source_table: string | null
          updated_at: string
        }
        Insert: {
          content: string
          content_hash?: string | null
          created_at?: string
          embedded_at?: string | null
          embedding?: string | null
          embedding_vec?: string | null
          id?: string
          metadata?: Json
          org_id: string
          source_pk?: string | null
          source_table?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          content_hash?: string | null
          created_at?: string
          embedded_at?: string | null
          embedding?: string | null
          embedding_vec?: string | null
          id?: string
          metadata?: Json
          org_id?: string
          source_pk?: string | null
          source_table?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
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
      staging_blackberry_locations: {
        Row: {
          altitude_m: number | null
          created_at: string
          external_device_id: string
          hdop: number | null
          lat: number
          lon: number
          org_id: string
          raw: Json | null
          recorded_at: string
          source: string
          speed_kmh: number | null
          src: string | null
          ts: string
        }
        Insert: {
          altitude_m?: number | null
          created_at?: string
          external_device_id: string
          hdop?: number | null
          lat: number
          lon: number
          org_id: string
          raw?: Json | null
          recorded_at: string
          source?: string
          speed_kmh?: number | null
          src?: string | null
          ts?: string
        }
        Update: {
          altitude_m?: number | null
          created_at?: string
          external_device_id?: string
          hdop?: number | null
          lat?: number
          lon?: number
          org_id?: string
          raw?: Json | null
          recorded_at?: string
          source?: string
          speed_kmh?: number | null
          src?: string | null
          ts?: string
        }
        Relationships: []
      }
      trac_activity: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          created_at: string
          due_date: string | null
          id: number
          invoice_amount: number | null
          invoice_category: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_status: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string
          due_date?: string | null
          id?: never
          invoice_amount?: number | null
          invoice_category?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string
          due_date?: string | null
          id?: never
          invoice_amount?: number | null
          invoice_category?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string | null
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
      trac_invoice: {
        Row: {
          created_at: string
          due_date: string | null
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
          due_date?: string | null
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
          due_date?: string | null
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
      trac_invoice_data: {
        Row: {
          column_headers: Json | null
          created_at: string
          id: string
          invoice_id: string
          row_data: Json
          sheet_name: string
          updated_at: string
          validated: boolean | null
        }
        Insert: {
          column_headers?: Json | null
          created_at?: string
          id?: string
          invoice_id: string
          row_data: Json
          sheet_name: string
          updated_at?: string
          validated?: boolean | null
        }
        Update: {
          column_headers?: Json | null
          created_at?: string
          id?: string
          invoice_id?: string
          row_data?: Json
          sheet_name?: string
          updated_at?: string
          validated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "trac_invoice_data_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "trac_invoice"
            referencedColumns: ["id"]
          },
        ]
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
      trac_invoice_staging: {
        Row: {
          account_code: string | null
          attachments: Json | null
          billing_date: string | null
          created_at: string
          currency: string | null
          due_date: string | null
          excel_headers: Json | null
          id: string
          invoice_date: string | null
          line_items: Json
          status: string | null
          summary_invoice_id: string
          total_amount: number | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          account_code?: string | null
          attachments?: Json | null
          billing_date?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          excel_headers?: Json | null
          id?: string
          invoice_date?: string | null
          line_items?: Json
          status?: string | null
          summary_invoice_id: string
          total_amount?: number | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          account_code?: string | null
          attachments?: Json | null
          billing_date?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          excel_headers?: Json | null
          id?: string
          invoice_date?: string | null
          line_items?: Json
          status?: string | null
          summary_invoice_id?: string
          total_amount?: number | null
          updated_at?: string
          vendor?: string | null
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
      user_orgs: {
        Row: {
          org_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          org_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          org_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_orgs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      asset_last_fix: {
        Row: {
          asset_id: string | null
          hdop: number | null
          location: unknown | null
          org_id: string | null
          recorded_at: string | null
          source: string | null
          velocity_cms: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_locations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_locations_kmh: {
        Row: {
          altitude_m: number | null
          asset_id: string | null
          contents: boolean | null
          contents_percentage: number | null
          created_at: string | null
          door_open: boolean | null
          hdop: number | null
          humidity_pct: number | null
          id: number | null
          location: unknown | null
          normalized_address: string | null
          org_id: string | null
          place_id: string | null
          pressure_pa: number | null
          raw: Json | null
          recorded_at: string | null
          source: string | null
          speed_kmh: number | null
          temperature_c: number | null
          velocity_cms: number | null
        }
        Insert: {
          altitude_m?: number | null
          asset_id?: string | null
          contents?: boolean | null
          contents_percentage?: number | null
          created_at?: string | null
          door_open?: boolean | null
          hdop?: number | null
          humidity_pct?: number | null
          id?: number | null
          location?: unknown | null
          normalized_address?: string | null
          org_id?: string | null
          place_id?: string | null
          pressure_pa?: number | null
          raw?: Json | null
          recorded_at?: string | null
          source?: string | null
          speed_kmh?: never
          temperature_c?: number | null
          velocity_cms?: number | null
        }
        Update: {
          altitude_m?: number | null
          asset_id?: string | null
          contents?: boolean | null
          contents_percentage?: number | null
          created_at?: string | null
          door_open?: boolean | null
          hdop?: number | null
          humidity_pct?: number | null
          id?: number | null
          location?: unknown | null
          normalized_address?: string | null
          org_id?: string | null
          place_id?: string | null
          pressure_pa?: number | null
          raw?: Json | null
          recorded_at?: string | null
          source?: string | null
          speed_kmh?: never
          temperature_c?: number | null
          velocity_cms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_locations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      dcli_invoice_line_item_enriched: {
        Row: {
          attachment_count: number | null
          attachments: Json | null
          bill_end_date: string | null
          bill_start_date: string | null
          billing_date: string | null
          billing_terms: string | null
          charge_description: string | null
          chassis: string | null
          container_in: string | null
          container_out: string | null
          corporate_account: string | null
          corporate_name: string | null
          created_at: string | null
          customer_name: string | null
          customer_number: string | null
          date_in: string | null
          date_out: string | null
          days_used: number | null
          dispute_status: string | null
          due_date: string | null
          grand_total: number | null
          haulage_type: string | null
          in_gate_fees: number | null
          invoice_status: string | null
          invoice_total: number | null
          invoice_type: string | null
          line_invoice_number: string | null
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
          remaining_balance: number | null
          subtotal: number | null
          summary_invoice_id: string | null
          tax_amount: number | null
          tax_rate_pct: number | null
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
          updated_at: string | null
        }
        Insert: {
          attachment_count?: number | null
          attachments?: Json | null
          bill_end_date?: string | null
          bill_start_date?: string | null
          billing_date?: string | null
          billing_terms?: string | null
          charge_description?: string | null
          chassis?: string | null
          container_in?: string | null
          container_out?: string | null
          corporate_account?: string | null
          corporate_name?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_number?: string | null
          date_in?: string | null
          date_out?: string | null
          days_used?: never
          dispute_status?: string | null
          due_date?: string | null
          grand_total?: number | null
          haulage_type?: string | null
          in_gate_fees?: number | null
          invoice_status?: string | null
          invoice_total?: number | null
          invoice_type?: string | null
          line_invoice_number?: string | null
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
          remaining_balance?: number | null
          subtotal?: number | null
          summary_invoice_id?: string | null
          tax_amount?: number | null
          tax_rate_pct?: number | null
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
          updated_at?: string | null
        }
        Update: {
          attachment_count?: number | null
          attachments?: Json | null
          bill_end_date?: string | null
          bill_start_date?: string | null
          billing_date?: string | null
          billing_terms?: string | null
          charge_description?: string | null
          chassis?: string | null
          container_in?: string | null
          container_out?: string | null
          corporate_account?: string | null
          corporate_name?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_number?: string | null
          date_in?: string | null
          date_out?: string | null
          days_used?: never
          dispute_status?: string | null
          due_date?: string | null
          grand_total?: number | null
          haulage_type?: string | null
          in_gate_fees?: number | null
          invoice_status?: string | null
          invoice_total?: number | null
          invoice_type?: string | null
          line_invoice_number?: string | null
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
          remaining_balance?: number | null
          subtotal?: number | null
          summary_invoice_id?: string | null
          tax_amount?: number | null
          tax_rate_pct?: number | null
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
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dcli_invoice_line_item_summary_invoice_id_fkey"
            columns: ["summary_invoice_id"]
            isOneToOne: false
            referencedRelation: "dcli_invoice"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      dcli_invoice_line_item_legacy: {
        Row: {
          attachment_count: number | null
          attachments: Json | null
          billing_date: string | null
          chassis_out: string | null
          container_in: string | null
          container_out: string | null
          created_at: string | null
          date_in: string | null
          date_out: string | null
          dispute_status: string | null
          invoice_status: string | null
          invoice_total: number | null
          invoice_type: string | null
          line_invoice_number: string | null
          remaining_balance: number | null
          summary_invoice_id: string | null
          updated_at: string | null
        }
        Insert: {
          attachment_count?: number | null
          attachments?: Json | null
          billing_date?: string | null
          chassis_out?: string | null
          container_in?: string | null
          container_out?: string | null
          created_at?: string | null
          date_in?: string | null
          date_out?: string | null
          dispute_status?: string | null
          invoice_status?: string | null
          invoice_total?: number | null
          invoice_type?: string | null
          line_invoice_number?: string | null
          remaining_balance?: number | null
          summary_invoice_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attachment_count?: number | null
          attachments?: Json | null
          billing_date?: string | null
          chassis_out?: string | null
          container_in?: string | null
          container_out?: string | null
          created_at?: string | null
          date_in?: string | null
          date_out?: string | null
          dispute_status?: string | null
          invoice_status?: string | null
          invoice_total?: number | null
          invoice_type?: string | null
          line_invoice_number?: string | null
          remaining_balance?: number | null
          summary_invoice_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dcli_invoice_line_item_summary_invoice_id_fkey"
            columns: ["summary_invoice_id"]
            isOneToOne: false
            referencedRelation: "dcli_invoice"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      latest_locations: {
        Row: {
          asset_id: string | null
          lat: number | null
          lon: number | null
          recorded_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_locations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_needs_reembed: {
        Row: {
          content: string | null
          content_hash: string | null
          created_at: string | null
          embedded_at: string | null
          embedding: string | null
          embedding_vec: string | null
          id: string | null
          metadata: Json | null
          org_id: string | null
          source_pk: string | null
          source_table: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          embedded_at?: string | null
          embedding?: string | null
          embedding_vec?: string | null
          id?: string | null
          metadata?: Json | null
          org_id?: string | null
          source_pk?: string | null
          source_table?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          embedded_at?: string | null
          embedding?: string | null
          embedding_vec?: string | null
          id?: string | null
          metadata?: Json | null
          org_id?: string | null
          source_pk?: string | null
          source_table?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rag_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      staging_blackberry_locations_mapped: {
        Row: {
          altitude_m: number | null
          asset_id: string | null
          created_at: string | null
          external_device_id: string | null
          hdop: number | null
          lat: number | null
          lon: number | null
          org_id: string | null
          raw: Json | null
          recorded_at: string | null
          source: string | null
          speed_kmh: number | null
          src: string | null
          ts: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blackberry_device_map_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      unmapped_blackberry_devices: {
        Row: {
          external_device_id: string | null
          first_seen: string | null
          last_seen: string | null
          org_id: string | null
          samples: number | null
        }
        Relationships: []
      }
      v_invoice_totals: {
        Row: {
          invoice_id: string | null
          sum_line_total: number | null
          total_amount_due: number | null
        }
        Relationships: []
      }
      v_resolved_flags: {
        Row: {
          created_at: string | null
          id: string | null
          key: string | null
          org_id: string | null
          role: string | null
          role_key: string | null
          scope: string | null
          updated_at: string | null
          user_id: string | null
          user_key: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          key?: string | null
          org_id?: string | null
          role?: string | null
          role_key?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_key?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          key?: string | null
          org_id?: string | null
          role?: string | null
          role_key?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_key?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
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
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
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
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
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
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
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
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
        Returns: string
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      close_dispute: {
        Args: { line_id: string; note: string }
        Returns: undefined
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
          | { column_name: string; schema_name: string; table_name: string }
          | { column_name: string; table_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      fleet_get_latest_location_point: {
        Args: { p_asset_id: string }
        Returns: {
          lat: number
          lon: number
        }[]
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
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
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
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
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
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
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
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
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_distinct_external_device_ids: {
        Args: { p_org_id: string }
        Returns: {
          external_device_id: string
        }[]
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_unmapped_blackberry_device_ids: {
        Args: { p_org_id: string }
        Returns: {
          external_device_id: string
        }[]
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ingest_blackberry_locations: {
        Args: { p_org_id: string; p_since?: string }
        Returns: number
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      jwt_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      match_rag_docs: {
        Args: { match_count?: number; org: string; query_embedding: string }
        Returns: {
          content: string
          score: number
          source_pk: string
          source_table: string
        }[]
      }
      normalize_equip_id: {
        Args: { t: string }
        Returns: string
      }
      open_dispute: {
        Args: { line_id: string; note: string; reason: string }
        Returns: undefined
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: string
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
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
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
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
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
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
      st_3dperimeter: {
        Args: { "": unknown }
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
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { format?: string; geom: unknown }
        Returns: string
      }
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
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; rel?: number }
          | { geom: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
          | {
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
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; options?: string; radius: number }
          | { geom: unknown; quadsegs: number; radius: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
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
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
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
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
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
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { dm?: number; dx: number; dy: number; dz?: number; geom: unknown }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
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
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
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
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { font?: Json; letters: string }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
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
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
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
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
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
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
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
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
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
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { from_proj: string; geom: unknown; to_proj: string }
          | { from_proj: string; geom: unknown; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
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
      upsert_blackberry_config: {
        Args: { p_options: Json; p_org_id: string }
        Returns: undefined
      }
      validate_dcli_invoice: {
        Args: {
          p_account_code: string
          p_billing_date: string
          p_due_date: string
          p_line_items: Json
          p_summary_invoice_id: string
        }
        Returns: Json
      }
      validate_invoice_line: {
        Args: { line_id: string }
        Returns: undefined
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
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
