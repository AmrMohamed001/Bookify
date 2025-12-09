Bookify Software Requirements Specification Version: 1.0 Date: December
8, 2025 Project: Digital & Physical Book Marketplace Platform Table of
Contents 1. Introduction 2. System Features Summary. 3. User Roles &
Permissions 4. Functional Requirements 5. Non-Functional Requirements 6.
Data Model (Detailed Schema) 7. API Endpoints (Detailed) 8. Security &
Compliance 9. Operational Requirements & Deployment 10. Acceptance
Criteria 11. Project Plan & Milestones 12. Appendices 1. Introduction
1.1 Purpose This Software Requirements Specification (SRS) defines the
requirements for Bookify --- a digital and physical book marketplace
focused on one-time purchases. The platform uses Cloudinary for chunked
PDF uploads and MongoDB for data storage. Authentication uses JWT access
and refresh tokens with role-based access control (RBAC).

1.2 System Overview Bookify allows users to browse, purchase (both
digital and physical books), and read content securely. Authors can
upload and manage their books, while administrators moderate content and
manage platform operations. The system delivers secure reading
experiences via signed URLs and supports comprehensive e-commerce
functionality. 1.3 Scope In Scope: ¢ User authentication and
authorization with JWT « Digital and physical book marketplace e Chunked
PDF upload and preview generation ¢ Shopping cart and checkout system «
Digital library and online reader ¢ Review and rating system ¢ Advanced
search capabilities ¢ Author and admin dashboards Out of Scope: ¢
Subscription-based models ¢ Social networking features o Third-party
integrations beyond payment gateways « Mobile native applications
(initial release) 1.4 Definitions and Acronyms ¢ SRS: Software
Requirements Specification e JWT: JSON Web Token ¢ RBAC: Role-Based
Access Control \* API: Application Programming Interface e CRUD: Create,
Read, Update, Delete ¢ PDF: Portable Document Format ¢ ISBN:
International Standard Book Number

2.  System Features Summary Bookify provides a comprehensive set of
    features to support all stakeholders: ¢ Authentication &
    Authorization: JWT access tokens with refresh token rotation and
    RBAC ¢ Cloud Storage Integration: Cloudinary chunked upload with
    automatic preview generation ¢ E-Commerce Functionality: One-time
    purchases for digital and physical books « Shopping Experience:
    Persistent shopping cart, secure checkout, invoice generation, and
    order management Digital Library: User library with secure online
    reader and reading progress tracking ¢ Social Features: Reviews,
    ratings, wishlist, and personalized recommendations ¢ Search
    Capabilities: Advanced full-text search powered by MongoDB ¢ Content
    Management: Author dashboard for book management and basic sales
    analytics ¢ Administration: Complete admin tools for user, book, and
    order management
3.  User Roles & Permissions 3.1 Guest Capabilities: « Browse book
    catalog ¢ View book details and previews Search books e View public
    reviews and ratings Restrictions: ¢ Cannot purchase books ¢ Cannot
    access library or reader ¢ Cannot leave reviews or use wishlist

3.2 Registered User Inherits: All Guest capabilities Additional
Capabilities: ¢ Purchase digital and physical books « Manage shopping
cart o Access personal digital library o Use online reader with progress
tracking ¢ Leave reviews and ratings ¢ Manage wishlist ¢ View order
history and invoices « Update profile information 3.3 Author Inherits:
All Registered User capabilities Additional Capabilities: ¢ Upload and
manage books ¢ Update book metadata ¢ View sales statistics ¢ Manage
book pricing ¢ Access author dashboard Restrictions: \* Requires admin
approval to publish books ¢ Cannot manage other authors' content 3.4
Administrator Inherits: All system capabilities Exclusive Capabilities:
¢ Manage all users (CRUD operations) ¢ Moderate and manage all books

¢ Manage all orders « Approve/reject author applications o Generate
system reports « Configure platform settings e Access analytics
dashboard 4. Functional Requirements 4.1 Authentication & Authorization
FR-AUTH-001: User Registration ¢ Users must register with email,
password, and basic profile information ¢ Email verification required
before full access « Password must meet security requirements (minimum 8
characters, mixed case, numbers, special characters) FR-AUTH-002: User
Login o Users authenticate with email and password « System generates
JWT access token (15-minute expiry) ¢ System generates refresh token
(7-day expiry) stored as httpOnly cookie FR-AUTH-003: Token Refresh ¢
Users can refresh access token using valid refresh token ¢ Refresh token
rotation implemented for security ¢ Automatic token refresh on API calls
when access token expires FR-AUTH-004: User Logout o Invalidate refresh
token on logout ¢ Clear client-side tokens ¢ Log logout event for
security audit FR-AUTH-005: Role-Based Access Control

¢ System enforces role-based permissions on all protected routes «
Middleware validates user role before granting access ¢ Unauthorized
access attempts logged 4.2 Book Management FR-BOOK-001: Book Upload
(Authors) o Authors upload PDF files in chunks via Cloudinary o Support
for files up to 100MB « Automatic preview generation (first 5-10 pages)
¢ Progress indicator during upload FR-BOOK-002: Book Metadata Management
« Authors provide: title, description, ISBN, genre, price, author info «
Support for digital-only, physical-only, or both formats ¢ Optional
cover image upload o Tags and categories for organization FR-BOOK-003:
Book Listing (Admin) e Admin reviews and approves/rejects submitted
books ¢ Admin can edit any book metadata ¢ Admin can unpublish or delete
books ¢ Rejection requires reason provided to author FR-BOOK-004: Book
Preview ¢ All users can preview sample pages (5-10 pages) ¢ Preview
delivered via Cloudinary transformation ¢ No download option for preview
4.3 Shopping Cart & Checkout FR-CART-001: Add to Cart o Users can add
books (digital/physical) to cart « Mixed cart support (both formats in
same cart)

¢ Cart persists across sessions ¢ Quantity management for physical books
FR-CART-002: Cart Management ¢ Users can view, update quantities, and
remove items ¢ Real-time price calculation ¢ Apply promotional codes (if
available) « Display stock availability for physical books FR-CART-003:
Checkout Process o Collect shipping address for physical books o
Integrate payment gateway (Stripe/PayPal) ¢ Generate order confirmation
¢ Send confirmation email FR-CART-004: Invoice Generation ¢ Generate PDF
invoice for each order o Include order details, pricing, taxes, and
shipping Store invoice for user access ¢ Support invoice download 4.4
Digital Library & Reader FR-LIB-001: User Library ¢ Display all
purchased digital books ¢ Filter and sort options (date, title, author)
\* Show reading progress for each book ¢ Access to download receipts
FR-LIB-002: Online Reader ¢ Deliver books via signed Cloudinary URLs
(30-minute expiry) « Page navigation (next, previous, jump to page) e
Track and save reading progress

¢ Responsive reader interface FR-LIB-003: Reading Progress « Auto-save
current page on navigation ¢ Display progress percentage ¢ Resume from
last read position ¢ Sync across devices (if logged in) FR-LIB-004:
Download Management ¢ Users can download purchased books (limited
downloads) e Track download count per book ¢ Watermark PDFs with user
information 4.5 Reviews & Ratings FR-REV-001: Leave Review o Users can
review purchased books only Rating (1-5 stars) required \* Optional text
review (max 1000 characters) ¢ One review per user per book FR-REV-002:
Manage Reviews ¢ Users can edit/delete their own reviews ¢ Admin can
moderate/remove inappropriate reviews ¢ Display average rating and
review count on book page FR-REV-003: Review Helpfulness o Users can
mark reviews as helpful ¢ Sort reviews by helpfulness, date, or rating
4.6 Wishlist FR-WISH-001: Wishlist Management ¢ Users can add/remove
books from wishlist ¢ Wishlist persists across sessions

¢ Display wishlist on user profile « Notification when wishlisted book
goes on sale 4.7 Search & Recommendations FR-SRCH-001: Advanced Search o
Full-text search using MongoDB text indexes o Search by title, author,
ISBN, genre, tags Filter results by price, format, rating, publication
date o Sort results by relevance, price, rating, date FR-SRCH-002:
Autocomplete « Real-time search suggestions as user types o Show top
5-10 matching results o Include book covers in suggestions FR-SRCH-003:
Recommendations « Rule-based recommendations on book detail pages «
Based on genre, author, and user purchase history ¢ Display "Customers
also bought" section o Personalized recommendations on homepage (for
logged-in users) 4.8 Author Dashboard FR-AUTH-001: Book Management ¢
View all uploaded books and their status ¢ Edit book metadata for
unpublished books o Delete unpublished books e View rejection reasons
FR-AUTH-002: Sales Analytics \* View total sales count per book \* View
revenue per book « Basic charts (sales over time)

¢ Export sales data as CSV 4.9 Admin Dashboard FR-ADM-001: User
Management ¢ View all users with role filters « Edit user roles and
status ¢ Deactivate/reactivate user accounts \* View user activity logs
FR-ADM-002: Book Management o View all books with status filters ¢
Approve/reject pending books « Edit any book metadata Unpublish/delete
books FR-ADM-003: Order Management o View all orders with status filters
¢ Update order status (processing, shipped, delivered) View order
details and customer information ¢ Generate shipping labels (future
enhancement) FR-ADM-004: Reporting ¢ Generate sales reports (daily,
weekly, monthly) o User registration and activity reports « Revenue
reports by book, author, genre « Export reports as PDF/CSV 5.
Non-Functional Requirements 5.1 Performance NFR-PERF-001: Response Time

¢ API endpoints respond within 200ms for 95% of requests o Search
results display within 500ms ¢ Reader loads within 1 second
NFR-PERF-002: Scalability « Support 10,000 concurrent users ¢ Handle 100
book uploads per hour o Scale horizontally via containerization
NFR-PERF-003: Throughput e Process 1,000 transactions per hour « Support
5S0MB/s aggregate upload bandwidth 5.2 Security NFR-SEC-001: Data
Encryption o All data in transit encrypted via HTTPS/TLS 1.3 « Passwords
hashed using berypt (cost factor 12) « Sensitive database fields
encrypted at rest NFR-SEC-002: Authentication Security o JWT tokens
signed with RS256 algorithm ¢ Refresh tokens use secure random
generation « Implement rate limiting on authentication endpoints (5
attempts per 15 minutes) NFR-SEC-003: API Security ¢ Implement CORS with
whitelist « Rate limiting on all API endpoints (100 requests per minute
per IP) ¢ Input validation and sanitization on all endpoints
NFR-SEC-004: File Security « Validate file types and sizes on upload ¢
Scan uploaded files for malware ¢ Use signed URLs with expiration for
content delivery

5.3 Reliability NFR-REL-001: Availability ¢ System uptime of 99.9%
(excluding scheduled maintenance) ¢ Maximum 1 hour planned downtime per
month ¢ Graceful degradation during partial outages NFR-REL-002: Data
Integrity o Database transactions ensure ACID properties ¢ Regular
automated backups (daily full, hourly incremental) ¢ Point-in-time
recovery capability NFR-REL-003: Error Handling o Graceful error
messages for users ¢ Comprehensive error logging for debugging ¢
Automatic retry logic for transient failures 5.4 Usability NFR-USE-001:
User Interface ¢ Responsive design supporting desktop, tablet, mobile e
WCAG 2.1 AA accessibility compliance « Intuitive navigation with max 3
clicks to any feature NFR-USE-002: User Experience « Consistent UI/UX
across all pages « Loading indicators for long operations o Clear error
messages with actionable guidance 5.5 Maintainability NFR-MAIN-001: Code
Quality « Modular architecture with clear separation of concerns ¢ Code
coverage minimum 80% for critical paths ¢ Comprehensive API
documentation using OpenAPI/Swagger

NFR-MAIN-002: Monitoring « Application performance monitoring (APM) o
Real-time error tracking and alerting o System health dashboard 5.6
Compliance NFR-COMP-001: Legal Compliance e GDPR compliance for EU users
¢ PCI DSS compliance for payment processing « Copyright and DMCA
compliance mechanisms NFR-COMP-002: Privacy o Clear privacy policy and
terms of service ¢ User consent management for data collection ¢ Right
to deletion and data export 6. Data Model (Detailed Schema) 6.1 User
Collection Jjavascript

} Objectld, email: String (unique, required), password: String (hashed,
required), firstName: String (required), lastName: String (required),
role: String (enum: \['guest', 'user', 'author', 'admin'\], default:
'user'), isEmailVerified: Boolean (default: false), profile: { avatar:
String (URL), bio: String, phone: String, addresses: \[ { type: String
(enum: \['shipping', 'billing'\]), street: String, city: String, state:
String, zipCode: String, country: String, isDefault: Boolean 1 b
authorlnfo: { isApproved: Boolean (default: false), approvedAt: Date,
approvedBy: Objectld (ref: User), rejectionReason: String, biography:
String, website: String b refreshTokens: \[ { token: String (hashed),
expiresAt: Date, createdAt: Date 1 createdAt: Date (default: Date.now),
updatedAt: Date, lastLoginAt: Date, isActive: Boolean (default: true)

6.2 Book Collection javascript

\_id: Objectld, isbn: String (unique, indexed), title: String (required,
indexed), description: String, author: { userld: Objectld (ref: User,
required), name: String (required), bio: String }s coverlmage: { url:
String, publicld: String (Cloudinary) I pdfFile: { url: String
(Cloudinary), publicld: String, sizeInBytes: Number, pageCount: Number b
preview: { url: String (Cloudinary signed), pageRange: String (e.g.,
"1-10") b pricing: { digital: { price; Number, currency: String
(default: 'USD"), isAvailable: Boolean (default: true) b physical: {
price: Number, currency: String (default: 'USD"), isAvailable: Boolean
(default: false), stock: Number (default: 0) 1 f b metadata; { genre:
\[String\] (indexed), tags: \[String\], language: String (default:
'en"), publisher: String, publishedDate: Date,

edition: String, pageCount: Number sta totalSales: Number (default: 0),
averageRating: Number (default: 0), reviewCount: Number (default: 0),
viewCount: Number (default: 0) 1 status: String (enum: \['draft!,
'pending', 'approved', 'rejected', 'unpublished'\], default: 'draft'),
adminReview: { reviewedBy: Objectld (ref: User), reviewedAt: Date.
rejectionReason: String createdAt: Date (default: Date.now), updatedAt:
Date, publishedAt: Date 6.3 Order Collection Jjavascript

{ l \_id: Objectld, orderNumber: String (unique, indexed), userld:
Objectld (ref: User, required), items: \[ { bookld: Objectld (ref: Book,
required), title: String, format: String (enum: \['digital',
'physical'\]), price: Number, quantity: Number (default: 1) Y pricing: {
subtotal: Number, tax: Number, shipping: Number, discount: Number
(default: 0), total: Number h shippingAddress: { street: String, city:
String, state: String, zipCode: String, country: String b payment: {
method: String (enum: \['stripe, 'paypal'\]), transactionld: String,
status: String (enum: \['pending', 'completed', 'failed', 'refunded'\]),
paidAt: Date b fulfillment: { status: String (enum: \['pending',
'processing', 'shipped', 'delivered', 'cancelled'\]), shippedAt: Date,
deliveredAt: Date, trackingNumber: String, carrier: String b invoice: {
url: String, generatedAt: Date N createdAt: Date (default: Date.now),

updatedAt: Date 6.4 Review Collection Jjavascript \_id: bookld: Objectld
userld: Objectld rating: Number min: 1, max: § reviewText: String : 1000
helpfulCount: Number (default: 0 helpfulBy: isVerifiedPurchase: Boolean
(default: false status: String (enum: \['active', 'hidden', 'deleted'\],
default: 'active' moderatedBy: Objectld moderatedAt: Date. createdAt:
Date (default: Date updatedAt: Date 6.5 Cart Collection javascript id
userld: Objectld items: booklId: Objectld format: String (enum:
\['digital', 'physical" quantity: Number (default: 1 price: Number.
addedAt: Date (default: Date updatedAt: Date (default: Date 6.6 Wishlist
Collection javascript \] ¢ Response: POST /api/wishlist/items (User
only) ¢ Description: Add book to wishlist ¢ Request Body: ( { "bookId":
".." } \* Response: (2 DELETE /api/wishlist/items/:bookId (User only) ¢
Description: Remove from wishlist ¢ Response: 7.8 Search Endpoints GET
/api/search « Description: Search books with full-text search

¢ Query Parameters: (search query, required) (genre, price range,
format) ¢ Response: GET /api/search/autocomplete e Description: Get
search suggestions ¢ Query Parameters: @ (partial query) ¢ Response: OK
7.9 Author Dashboard Endpoints GET /api/author/books (Author only) «
Description: Get author's books ¢ Headers: (Authorization: Bearer
{accessToken}) GET /api/author/sales (Author only) ¢ Description: Get
sales analytics ¢ Response: json "success": true, "data": "totalSales":
1250. ""totalRevenue": 12450.00, "bookStats

7.10 Admin Endpoints GET /api/admin/users (Admin only)
