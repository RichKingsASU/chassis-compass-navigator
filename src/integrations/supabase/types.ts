export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      anytrek_gps_logs: {
        Row: {
          address: string | null
          country: string | null
          device_id: string | null
          driving_direction: string | null
          driving_status: string | null
          dwell_time: string | null
          id: string
          landmark_enter_time: string | null
          last_location_utc: string | null
          latitude: number | null
          longitude: number | null
          speed_mph: number | null
          state_province: string | null
          uploaded_at: string | null
          vehicle_group: string | null
        }
        Insert: {
          address?: string | null
          country?: string | null
          device_id?: string | null
          driving_direction?: string | null
          driving_status?: string | null
          dwell_time?: string | null
          id?: string
          landmark_enter_time?: string | null
          last_location_utc?: string | null
          latitude?: number | null
          longitude?: number | null
          speed_mph?: number | null
          state_province?: string | null
          uploaded_at?: string | null
          vehicle_group?: string | null
        }
        Update: {
          address?: string | null
          country?: string | null
          device_id?: string | null
          driving_direction?: string | null
          driving_status?: string | null
          dwell_time?: string | null
          id?: string
          landmark_enter_time?: string | null
          last_location_utc?: string | null
          latitude?: number | null
          longitude?: number | null
          speed_mph?: number | null
          state_province?: string | null
          uploaded_at?: string | null
          vehicle_group?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          address: string | null
          asset_id: string
          created_at: string | null
          days_dormant: number | null
          device_serial_number: number | null
          event_reason: string | null
          gps_time: string | null
          id: string
          landmark: string | null
          nearest_major_city: string | null
          report_time: string | null
        }
        Insert: {
          address?: string | null
          asset_id: string
          created_at?: string | null
          days_dormant?: number | null
          device_serial_number?: number | null
          event_reason?: string | null
          gps_time?: string | null
          id?: string
          landmark?: string | null
          nearest_major_city?: string | null
          report_time?: string | null
        }
        Update: {
          address?: string | null
          asset_id?: string
          created_at?: string | null
          days_dormant?: number | null
          device_serial_number?: number | null
          event_reason?: string | null
          gps_time?: string | null
          id?: string
          landmark?: string | null
          nearest_major_city?: string | null
          report_time?: string | null
        }
        Relationships: []
      }
      ccm_invoice: {
        Row: {
          bare_chassis_move_container_association: string | null
          bco_rebill_party: string | null
          chassis_user: string | null
          city: string | null
          container_number: string | null
          created_at: string | null
          days_disputed: number | null
          disputed_amount: number | null
          equipment_group: string | null
          file_name: string | null
          file_path: string | null
          file_type: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          pool: string | null
          provider: string | null
          reason_for_dispute: string | null
          reservation_number: string | null
          scac: string | null
          sl: string | null
          st_date: string | null
          start_move_date: string | null
          state: string | null
          status: string | null
          stop_move_date: string | null
          tags: string[] | null
          total_amount_usd: number | null
          total_usage: number | null
          usage_type: string | null
        }
        Insert: {
          bare_chassis_move_container_association?: string | null
          bco_rebill_party?: string | null
          chassis_user?: string | null
          city?: string | null
          container_number?: string | null
          created_at?: string | null
          days_disputed?: number | null
          disputed_amount?: number | null
          equipment_group?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          pool?: string | null
          provider?: string | null
          reason_for_dispute?: string | null
          reservation_number?: string | null
          scac?: string | null
          sl?: string | null
          st_date?: string | null
          start_move_date?: string | null
          state?: string | null
          status?: string | null
          stop_move_date?: string | null
          tags?: string[] | null
          total_amount_usd?: number | null
          total_usage?: number | null
          usage_type?: string | null
        }
        Update: {
          bare_chassis_move_container_association?: string | null
          bco_rebill_party?: string | null
          chassis_user?: string | null
          city?: string | null
          container_number?: string | null
          created_at?: string | null
          days_disputed?: number | null
          disputed_amount?: number | null
          equipment_group?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          pool?: string | null
          provider?: string | null
          reason_for_dispute?: string | null
          reservation_number?: string | null
          scac?: string | null
          sl?: string | null
          st_date?: string | null
          start_move_date?: string | null
          state?: string | null
          status?: string | null
          stop_move_date?: string | null
          tags?: string[] | null
          total_amount_usd?: number | null
          total_usage?: number | null
          usage_type?: string | null
        }
        Relationships: []
      }
      ccm_invoice_data: {
        Row: {
          created_at: string | null
          id: string
          invoice_id: string | null
          row_data: Json
          sheet_name: string | null
          validated: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          row_data: Json
          sheet_name?: string | null
          validated?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          row_data?: Json
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
      fleet_state_log: {
        Row: {
          accessory_pairing_details: string | null
          accessory_pairing_status: string | null
          address: string | null
          asset: string | null
          asset_associated: string | null
          asset_labels: string | null
          associated: string | null
          avg_speed_mph: number | null
          battery_last_update: string | null
          battery_state: string | null
          cargo_status: string | null
          created_at: string | null
          customer: string | null
          distance_mi: number | null
          door_duration: string | null
          door_state: string | null
          geofence: string | null
          humidity: string | null
          id: string
          idle_for: string | null
          last_door_update: string | null
          latitude_longitude: string | null
          leasing: string | null
          location_last_update: string | null
          max_speed_mph: number | null
          module: string | null
          module_activated: string | null
          module_type: string | null
          movement: string | null
          movement_duration: string | null
          movement_last_update: string | null
          sensors_last_update: string | null
          software_version: string | null
          temperature: string | null
          trip_count: number | null
        }
        Insert: {
          accessory_pairing_details?: string | null
          accessory_pairing_status?: string | null
          address?: string | null
          asset?: string | null
          asset_associated?: string | null
          asset_labels?: string | null
          associated?: string | null
          avg_speed_mph?: number | null
          battery_last_update?: string | null
          battery_state?: string | null
          cargo_status?: string | null
          created_at?: string | null
          customer?: string | null
          distance_mi?: number | null
          door_duration?: string | null
          door_state?: string | null
          geofence?: string | null
          humidity?: string | null
          id?: string
          idle_for?: string | null
          last_door_update?: string | null
          latitude_longitude?: string | null
          leasing?: string | null
          location_last_update?: string | null
          max_speed_mph?: number | null
          module?: string | null
          module_activated?: string | null
          module_type?: string | null
          movement?: string | null
          movement_duration?: string | null
          movement_last_update?: string | null
          sensors_last_update?: string | null
          software_version?: string | null
          temperature?: string | null
          trip_count?: number | null
        }
        Update: {
          accessory_pairing_details?: string | null
          accessory_pairing_status?: string | null
          address?: string | null
          asset?: string | null
          asset_associated?: string | null
          asset_labels?: string | null
          associated?: string | null
          avg_speed_mph?: number | null
          battery_last_update?: string | null
          battery_state?: string | null
          cargo_status?: string | null
          created_at?: string | null
          customer?: string | null
          distance_mi?: number | null
          door_duration?: string | null
          door_state?: string | null
          geofence?: string | null
          humidity?: string | null
          id?: string
          idle_for?: string | null
          last_door_update?: string | null
          latitude_longitude?: string | null
          leasing?: string | null
          location_last_update?: string | null
          max_speed_mph?: number | null
          module?: string | null
          module_activated?: string | null
          module_type?: string | null
          movement?: string | null
          movement_duration?: string | null
          movement_last_update?: string | null
          sensors_last_update?: string | null
          software_version?: string | null
          temperature?: string | null
          trip_count?: number | null
        }
        Relationships: []
      }
      fleet_state_transactions: {
        Row: {
          accessory_pairing_details: string | null
          accessory_pairing_status: string | null
          address: string | null
          asset: string | null
          asset_associated: string | null
          asset_labels: string | null
          avg_speed_mph: number | null
          battery_last_update: string | null
          battery_state: string | null
          cargo_status: string | null
          created_at: string | null
          customer_associated: string | null
          distance_mi: number | null
          door_duration: string | null
          door_state: string | null
          geofence: string | null
          humidity: string | null
          id: string
          idle_for: string | null
          last_door_update: string | null
          latitude_longitude: string | null
          leasing: string | null
          location_last_update: string | null
          max_speed_mph: number | null
          module: string | null
          module_activated: string | null
          module_type: string | null
          movement: string | null
          movement_duration: string | null
          movement_last_update: string | null
          sensors_last_update: string | null
          software_version: string | null
          temperature: string | null
          trip_count: number | null
        }
        Insert: {
          accessory_pairing_details?: string | null
          accessory_pairing_status?: string | null
          address?: string | null
          asset?: string | null
          asset_associated?: string | null
          asset_labels?: string | null
          avg_speed_mph?: number | null
          battery_last_update?: string | null
          battery_state?: string | null
          cargo_status?: string | null
          created_at?: string | null
          customer_associated?: string | null
          distance_mi?: number | null
          door_duration?: string | null
          door_state?: string | null
          geofence?: string | null
          humidity?: string | null
          id?: string
          idle_for?: string | null
          last_door_update?: string | null
          latitude_longitude?: string | null
          leasing?: string | null
          location_last_update?: string | null
          max_speed_mph?: number | null
          module?: string | null
          module_activated?: string | null
          module_type?: string | null
          movement?: string | null
          movement_duration?: string | null
          movement_last_update?: string | null
          sensors_last_update?: string | null
          software_version?: string | null
          temperature?: string | null
          trip_count?: number | null
        }
        Update: {
          accessory_pairing_details?: string | null
          accessory_pairing_status?: string | null
          address?: string | null
          asset?: string | null
          asset_associated?: string | null
          asset_labels?: string | null
          avg_speed_mph?: number | null
          battery_last_update?: string | null
          battery_state?: string | null
          cargo_status?: string | null
          created_at?: string | null
          customer_associated?: string | null
          distance_mi?: number | null
          door_duration?: string | null
          door_state?: string | null
          geofence?: string | null
          humidity?: string | null
          id?: string
          idle_for?: string | null
          last_door_update?: string | null
          latitude_longitude?: string | null
          leasing?: string | null
          location_last_update?: string | null
          max_speed_mph?: number | null
          module?: string | null
          module_activated?: string | null
          module_type?: string | null
          movement?: string | null
          movement_duration?: string | null
          movement_last_update?: string | null
          sensors_last_update?: string | null
          software_version?: string | null
          temperature?: string | null
          trip_count?: number | null
        }
        Relationships: []
      }
      fleetlocate_assets: {
        Row: {
          address: string | null
          asset_id: string | null
          battery_status: string | null
          city: string | null
          created_at: string | null
          device_type: string | null
          duration: string | null
          group: string | null
          id: string
          landmark: string | null
          last_event_date: string | null
          location: string | null
          serial_number: string | null
          state: string | null
          status: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          asset_id?: string | null
          battery_status?: string | null
          city?: string | null
          created_at?: string | null
          device_type?: string | null
          duration?: string | null
          group?: string | null
          id?: string
          landmark?: string | null
          last_event_date?: string | null
          location?: string | null
          serial_number?: string | null
          state?: string | null
          status?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          asset_id?: string | null
          battery_status?: string | null
          city?: string | null
          created_at?: string | null
          device_type?: string | null
          duration?: string | null
          group?: string | null
          id?: string
          landmark?: string | null
          last_event_date?: string | null
          location?: string | null
          serial_number?: string | null
          state?: string | null
          status?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      kf_chassis_report: {
        Row: {
          address: string | null
          chassis_id: string | null
          created_at: string | null
          dormant_days: number | null
          id: string
          landmark: string | null
          last_active: string | null
        }
        Insert: {
          address?: string | null
          chassis_id?: string | null
          created_at?: string | null
          dormant_days?: number | null
          id?: string
          landmark?: string | null
          last_active?: string | null
        }
        Update: {
          address?: string | null
          chassis_id?: string | null
          created_at?: string | null
          dormant_days?: number | null
          id?: string
          landmark?: string | null
          last_active?: string | null
        }
        Relationships: []
      }
      master_chassis_list: {
        Row: {
          chassis_number: string | null
          chassis_type: string | null
          contract_number: string | null
          created_at: string | null
          daily_rate: number | null
          id: string
          plate_number: string | null
          plate_state: string | null
          region: string | null
          serial_number: string | null
        }
        Insert: {
          chassis_number?: string | null
          chassis_type?: string | null
          contract_number?: string | null
          created_at?: string | null
          daily_rate?: number | null
          id?: string
          plate_number?: string | null
          plate_state?: string | null
          region?: string | null
          serial_number?: string | null
        }
        Update: {
          chassis_number?: string | null
          chassis_type?: string | null
          contract_number?: string | null
          created_at?: string | null
          daily_rate?: number | null
          id?: string
          plate_number?: string | null
          plate_state?: string | null
          region?: string | null
          serial_number?: string | null
        }
        Relationships: []
      }
      master_chassis_ltl_owned: {
        Row: {
          anytrek_unit_number: string | null
          charge_code: string | null
          chassis_number: string | null
          chassis_type: string | null
          created_at: string | null
          current_daily_rate: number | null
          description: string | null
          extended_gps_rate: number | null
          extended_rate: number | null
          gps_provider: string | null
          gps_rate_daily: number | null
          hard_gps_number: string | null
          id: string
          lessor: string | null
          notes: string | null
          old_chz_number: string | null
          region: string | null
          reporting_category: string | null
          serial_number: string | null
          status: string | null
          total_rate_1: number | null
          total_rate_2: number | null
        }
        Insert: {
          anytrek_unit_number?: string | null
          charge_code?: string | null
          chassis_number?: string | null
          chassis_type?: string | null
          created_at?: string | null
          current_daily_rate?: number | null
          description?: string | null
          extended_gps_rate?: number | null
          extended_rate?: number | null
          gps_provider?: string | null
          gps_rate_daily?: number | null
          hard_gps_number?: string | null
          id?: string
          lessor?: string | null
          notes?: string | null
          old_chz_number?: string | null
          region?: string | null
          reporting_category?: string | null
          serial_number?: string | null
          status?: string | null
          total_rate_1?: number | null
          total_rate_2?: number | null
        }
        Update: {
          anytrek_unit_number?: string | null
          charge_code?: string | null
          chassis_number?: string | null
          chassis_type?: string | null
          created_at?: string | null
          current_daily_rate?: number | null
          description?: string | null
          extended_gps_rate?: number | null
          extended_rate?: number | null
          gps_provider?: string | null
          gps_rate_daily?: number | null
          hard_gps_number?: string | null
          id?: string
          lessor?: string | null
          notes?: string | null
          old_chz_number?: string | null
          region?: string | null
          reporting_category?: string | null
          serial_number?: string | null
          status?: string | null
          total_rate_1?: number | null
          total_rate_2?: number | null
        }
        Relationships: []
      }
      wilmington_yard_inventory: {
        Row: {
          chassis_number: string | null
          comments: string | null
          container_number: string | null
          created_at: string | null
          date_in: string | null
          id: string
          inbound_carrier: string | null
          notes: string | null
          planned_exit_date: string | null
          repair_note: string | null
          return_instruction: string | null
          spot: string | null
          ssl_size: string | null
          status: string | null
          time_in: string | null
        }
        Insert: {
          chassis_number?: string | null
          comments?: string | null
          container_number?: string | null
          created_at?: string | null
          date_in?: string | null
          id?: string
          inbound_carrier?: string | null
          notes?: string | null
          planned_exit_date?: string | null
          repair_note?: string | null
          return_instruction?: string | null
          spot?: string | null
          ssl_size?: string | null
          status?: string | null
          time_in?: string | null
        }
        Update: {
          chassis_number?: string | null
          comments?: string | null
          container_number?: string | null
          created_at?: string | null
          date_in?: string | null
          id?: string
          inbound_carrier?: string | null
          notes?: string | null
          planned_exit_date?: string | null
          repair_note?: string | null
          return_instruction?: string | null
          spot?: string | null
          ssl_size?: string | null
          status?: string | null
          time_in?: string | null
        }
        Relationships: []
      }
      yard_report: {
        Row: {
          account_manager: string | null
          chassis_number: string | null
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          planned_exit: string | null
          release_id: string | null
          repair_status: string | null
          return_info: string | null
          seal: string | null
          ssl_size: string | null
          time_in: string | null
          trailer_number: string | null
          unit_type: string | null
          yard_area: string | null
        }
        Insert: {
          account_manager?: string | null
          chassis_number?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          planned_exit?: string | null
          release_id?: string | null
          repair_status?: string | null
          return_info?: string | null
          seal?: string | null
          ssl_size?: string | null
          time_in?: string | null
          trailer_number?: string | null
          unit_type?: string | null
          yard_area?: string | null
        }
        Update: {
          account_manager?: string | null
          chassis_number?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          planned_exit?: string | null
          release_id?: string | null
          repair_status?: string | null
          return_info?: string | null
          seal?: string | null
          ssl_size?: string | null
          time_in?: string | null
          trailer_number?: string | null
          unit_type?: string | null
          yard_area?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
