# VENUE BOOKING SYSTEM - TABLE RELATIONSHIPS

## 📊 **DATABASE SCHEMA OVERVIEW**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VENUE BOOKING SYSTEM                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│   BLOCKS    │    │     VENUES      │    │ VENUE_BOOKINGS  │    │   EVENTS    │
│             │    │                 │    │                 │    │             │
│ • id (PK)   │◄───┤ • id (PK)       │◄───┤ • id (PK)       │───►│ • id (PK)   │
│ • block_name│    │ • block_id (FK) │    │ • venue_id (FK) │    │ • venue_id  │
│             │    │ • venue_name    │    │ • event_id (FK) │    │ • title     │
│             │    │ • max_capacity  │    │ • booking_date  │    │ • event_date│
│             │    │ • facilities    │    │ • start_time    │    │ • start_time│
│             │    │ • is_active     │    │ • end_time      │    │ • end_time  │
│             │    │                 │    │ • booking_status│    │             │
└─────────────┘    └─────────────────┘    │ • booking_purpose│   └─────────────┘
                                          │ • expected_attendees│
                                          │ • special_requirements│
                                          │ • booking_reference│
                   ┌─────────────────┐    │ • priority_level│
                   │     USERS       │    │ • requires_approval│
                   │                 │    │ • approved_by   │
                   │ • id (PK)       │◄───┤ • booked_by_user_id (FK)│
                   │ • usernumber    │    │ • organizer_id (FK)│
                   │ • user_type     │    │ • created_at    │
                   │ • email         │    │ • updated_at    │
                   │                 │    └─────────────────┘
                   └─────────────────┘             │
                            │                      │
                            │                      ▼
                   ┌─────────────────┐    ┌─────────────────┐
                   │   ORGANIZERS    │    │BOOKING_EQUIPMENT│
                   │                 │    │                 │
                   │ • id (PK)       │◄───┤ • id (PK)       │
                   │ • user_id (FK)  │    │ • booking_id(FK)│
                   │ • name          │    │ • equipment_name│
                   │ • department    │    │ • quantity      │
                   │                 │    │ • equipment_type│
                   └─────────────────┘    │ • is_available  │
                                          └─────────────────┘
                   ┌─────────────────┐             │
                   │ ADMINISTRATORS  │             │
                   │                 │             ▼
                   │ • id (PK)       │    ┌─────────────────┐
                   │ • user_id (FK)  │◄───┤BOOKING_SERVICES │
                   │ • name          │    │                 │
                   │ • permissions   │    │ • id (PK)       │
                   └─────────────────┘    │ • booking_id(FK)│
                                          │ • service_name  │
                                          │ • service_type  │
                                          │ • service_cost  │
                                          │ • is_confirmed  │
                                          └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ BOOKING_HISTORY │
                                          │                 │
                                          │ • id (PK)       │
                                          │ • booking_id(FK)│
                                          │ • changed_by(FK)│
                                          │ • change_type   │
                                          │ • old_values    │
                                          │ • new_values    │
                                          │ • change_reason │
                                          └─────────────────┘

┌─────────────────┐    ┌─────────────────┐
│VENUE_AVAILABILITY│    │VENUE_MAINTENANCE│
│                 │    │                 │
│ • id (PK)       │    │ • id (PK)       │
│ • venue_id (FK) │◄───┤ • venue_id (FK) │
│ • day_of_week   │    │ • maintenance_type│
│ • available_from│    │ • maintenance_date│
│ • available_to  │    │ • start_time    │
│ • is_available  │    │ • end_time      │
└─────────────────┘    │ • maintenance_status│
                       │ • description   │
                       │ • performed_by  │
                       │ • cost          │
                       └─────────────────┘
```

## 🔗 **KEY RELATIONSHIPS**

### **1. CORE BOOKING FLOW:**
```
USERS → VENUE_BOOKINGS → VENUES → BLOCKS
  ↓           ↓              ↓
ORGANIZERS   EVENTS    VENUE_AVAILABILITY
```

### **2. BOOKING DETAILS:**
```
VENUE_BOOKINGS
    ├── BOOKING_EQUIPMENT (1:N)
    ├── BOOKING_SERVICES (1:N)
    └── BOOKING_HISTORY (1:N)
```

### **3. VENUE MANAGEMENT:**
```
VENUES
    ├── VENUE_AVAILABILITY (1:N)
    ├── VENUE_MAINTENANCE (1:N)
    └── VENUE_BOOKINGS (1:N)
```

## 📋 **TABLE PURPOSES**

| Table | Purpose | Key Features |
|-------|---------|-------------|
| **venue_bookings** | Main booking records | Status tracking, approval workflow, time slots |
| **booking_equipment** | Equipment requests per booking | Audio/visual equipment, furniture, technical gear |
| **booking_services** | Additional services per booking | Catering, cleaning, security, technical support |
| **booking_history** | Audit trail of all changes | Who changed what, when, and why |
| **venue_availability** | When venues are available | Day-wise availability hours |
| **venue_maintenance** | Maintenance schedules | Prevents bookings during maintenance |

## 🔄 **AUTOMATED WORKFLOWS**

### **Event → Booking Integration:**
1. **Event Created** → Auto-creates venue booking
2. **Event Approved** → Booking status → 'confirmed'
3. **Event Cancelled** → Booking status → 'cancelled'

### **Conflict Prevention:**
1. **Time Overlap Check** → Prevents double booking
2. **Maintenance Check** → Blocks bookings during maintenance
3. **Availability Check** → Respects venue operating hours

### **Audit Trail:**
1. **All Changes Logged** → booking_history table
2. **User Tracking** → Who made what changes
3. **Status History** → Complete lifecycle tracking

## 🎯 **BOOKING STATUSES**

| Status | Description | Next Actions |
|--------|-------------|-------------|
| **pending** | Awaiting approval | Admin can approve/reject |
| **confirmed** | Approved and locked | Can be completed/cancelled |
| **cancelled** | Booking cancelled | Archive record |
| **completed** | Event finished | Archive record |
| **draft** | Incomplete booking | User can complete |

## 🔧 **KEY FUNCTIONS**

1. **check_venue_booking_availability()** - Comprehensive availability check
2. **create_venue_booking()** - Safe booking creation with validation
3. **get_venue_bookings()** - Flexible booking retrieval with filters
4. **Auto-triggers** - Automatic booking creation for events

This system provides complete venue booking management with proper normalization, relationships, and automated workflows! 🎉
