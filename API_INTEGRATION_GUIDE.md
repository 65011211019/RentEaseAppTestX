# API Integration Guide - Owner Rental History

## 📋 **ภาพรวม**
คู่มือนี้แสดงการใช้งาน API สำหรับหน้า Owner Rental History ที่อัปเดตแล้ว

---

## 🔧 **การอัปเดตที่ทำ**

### 1. **อัปเดต rentalService.ts**
- เพิ่มฟังก์ชัน `getOwnerRentals()` สำหรับดึงข้อมูลการเช่าของเจ้าของ
- เพิ่มฟังก์ชัน `getRentalByIdOrUid()` สำหรับดึงรายละเอียดการเช่า
- อัปเดตฟังก์ชัน `approveRentalRequest()` และ `rejectRentalRequest()` ให้ใช้ API ใหม่

### 2. **อัปเดต OwnerRentalHistoryPage.tsx**
- ใช้ API `GET /api/owners/me/rentals` แทน API เดิม
- เพิ่มฟีเจอร์การค้นหาและกรองข้อมูล
- เพิ่ม pagination
- ปรับปรุง UI ให้ดูดีขึ้น

### 3. **อัปเดต OwnerRentalDetailPage.tsx**
- ใช้ API `GET /api/rentals/{rental_id_or_uid}` สำหรับดึงรายละเอียด
- ใช้ API `PUT /api/rentals/{rental_id_or_uid}/approve` สำหรับอนุมัติ
- ใช้ API `PUT /api/rentals/{rental_id_or_uid}/reject` สำหรับปฏิเสธ
- ปรับปรุง UI ให้แสดงข้อมูลครบถ้วน

### 4. **อัปเดต types.ts**
- เพิ่ม `actual_pickup_time?: string | null`
- เพิ่ม `owner_payout_amount?: number | null`

---

## 🚀 **ฟีเจอร์ใหม่**

### **OwnerRentalHistoryPage**
- ✅ **การค้นหา**: ค้นหาตามชื่อสินค้า
- ✅ **การกรองสถานะ**: กรองตามสถานะการเช่า 12 แบบ
- ✅ **การกรองวันที่**: กรองตามช่วงวันที่
- ✅ **Pagination**: แสดงข้อมูลทีละหน้า
- ✅ **Status Badges**: แสดงสถานะด้วยสีที่แตกต่างกัน
- ✅ **Responsive Design**: รองรับทุกขนาดหน้าจอ

### **OwnerRentalDetailPage**
- ✅ **รายละเอียดครบถ้วน**: แสดงข้อมูลการเช่าทั้งหมด
- ✅ **การอนุมัติ/ปฏิเสธ**: สำหรับการเช่าที่รอการอนุมัติ
- ✅ **Timeline**: แสดงประวัติการเปลี่ยนแปลง
- ✅ **Financial Details**: แสดงรายละเอียดทางการเงิน
- ✅ **Actions Panel**: แสดงปุ่มดำเนินการตามสถานะ

---

## 📊 **API Endpoints ที่ใช้**

### 1. **GET /api/owners/me/rentals**
```typescript
// Query Parameters
{
  status?: string;        // สถานะการเช่า
  q?: string;            // ค้นหาชื่อสินค้า
  date_from?: string;    // วันที่เริ่มต้น (ISO)
  date_to?: string;      // วันที่สิ้นสุด (ISO)
  page?: number;         // หน้าข้อมูล
  limit?: number;        // จำนวนรายการต่อหน้า
}
```

### 2. **GET /api/rentals/{rental_id_or_uid}**
```typescript
// Path Parameters
rental_id_or_uid: string | number
```

### 3. **PUT /api/rentals/{rental_id_or_uid}/approve**
```typescript
// Path Parameters
rental_id_or_uid: string | number

// Body: ไม่ต้องมี (empty)
```

### 4. **PUT /api/rentals/{rental_id_or_uid}/reject**
```typescript
// Path Parameters
rental_id_or_uid: string | number

// Body
{
  reason: string;  // เหตุผลในการปฏิเสธ (5-500 ตัวอักษร)
}
```

---

## 🎨 **UI Components ใหม่**

### **StatusBadge Component**
```typescript
<StatusBadge status="pending_owner_approval" type="rental" />
```

### **Pagination Component**
```typescript
<Pagination 
  currentPage={1} 
  totalPages={5} 
  onPageChange={handlePageChange} 
/>
```

---

## 🔐 **การยืนยันตัวตน**
ทุก API ต้องใช้ Bearer Token:
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## 📱 **การใช้งาน**

### **การเข้าถึงหน้า**
1. เข้าสู่ระบบด้วยบัญชีเจ้าของ
2. ไปที่ Owner Dashboard
3. คลิก "Rental History" หรือ "ประวัติการให้เช่า"

### **การกรองข้อมูล**
1. ใช้ช่องค้นหาเพื่อค้นหาสินค้า
2. เลือกสถานะจาก dropdown
3. กำหนดช่วงวันที่
4. คลิก "Apply Filters"

### **การอนุมัติ/ปฏิเสธ**
1. คลิก "View Details" ในรายการที่ต้องการ
2. ในหน้ารายละเอียด จะมีปุ่ม "Approve Request" หรือ "Reject Request"
3. สำหรับการปฏิเสธ ต้องระบุเหตุผล

---

## 🐛 **การแก้ไขปัญหา**

### **Error Handling**
- 401: Token ไม่ถูกต้องหรือหมดอายุ
- 403: ไม่มีสิทธิ์เข้าถึง
- 404: ไม่พบข้อมูล
- 400: ข้อมูลไม่ถูกต้อง

### **Loading States**
- แสดง LoadingSpinner ขณะโหลดข้อมูล
- แสดง ErrorMessage เมื่อเกิดข้อผิดพลาด
- ปุ่มแสดงสถานะ loading ขณะดำเนินการ

---

## 📈 **Performance**
- ใช้ `useCallback` เพื่อป้องกัน re-render ที่ไม่จำเป็น
- ใช้ `useState` สำหรับจัดการ state
- ใช้ `useEffect` สำหรับการ fetch ข้อมูล
- ใช้ debounce สำหรับการค้นหา (ถ้าต้องการ)

---

## 🔄 **การอัปเดตในอนาคต**
- เพิ่มการแจ้งเตือน real-time
- เพิ่มการ export ข้อมูล
- เพิ่มการกรองเพิ่มเติม
- เพิ่มการแสดงสถิติ 