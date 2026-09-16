# Đưa SkillMAP lên web

Gói `skillmap-deploy.zip` chứa frontend Next.js, FastAPI, dữ liệu thị trường, tài khoản demo được tự tạo và CV giả lập. Không chứa `.env`, API key hay database tài khoản/CV cá nhân trên máy.

1. Tạo tài khoản GitHub và Render. Tạo repository GitHub Private, giải nén ZIP rồi đưa nội dung bên trong lên gốc repository.
2. Trên Render chọn New → Blueprint và kết nối repository. `render.yaml` cấu hình dịch vụ Docker `skillmap-app`, Singapore, ổ bền vững 1 GB cho SQLite hồ sơ. Cấu hình này trả phí: xem giá Render trước khi tạo dịch vụ.
3. Nhập `GEMINI_API_KEY` trong phần secret Render. Không đưa file `.env` lên GitHub. Model hiện dùng `gemini-3.5-flash-lite`; secret đăng nhập và mật khẩu demo được Render sinh tự động.
4. Deploy rồi mở URL thực tế Render cấp. `skillmap-app.onrender.com` chỉ là tên dự kiến, chưa được đăng ký. Script tự dùng `RENDER_EXTERNAL_URL` cho đăng nhập.
5. Kiểm tra đăng nhập demo Phương, CV giả lập, Mapi, bảng tăng/giảm và các route mới `/organization`, `/investment`, `/transition`, `/intelligence`, `/transformation`.
6. Nếu gắn tên miền riêng, cấu hình DNS theo Render rồi đặt `BETTER_AUTH_URL=https://<tên-miền-thực-tế>` và restart.

Tài khoản demo/CV giả lập được seed lần đầu; các lần restart tiếp theo giữ dữ liệu đã lưu trong `/var/data`. Demo là tài khoản dùng chung: dùng tài khoản riêng cho CV cá nhân thật. Muốn reset demo trước trình bày, chạy trong Shell của dịch vụ: `RESET_DEMO_DATA=true node --experimental-transform-types scripts/reset-demo.mts`.

Muốn Quên mật khẩu gửi email thật cần cấu hình SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD và SMTP_FROM. Không cấu hình SMTP thì chức năng gửi email chưa sẵn sàng. Sao lưu database định kỳ. Nếu bộ nhớ không đủ khi xử lý CV, nâng cấu hình dịch vụ.

Chưa triển khai lên hosting và chưa kiểm thử container Docker trên máy này. Production build/local browser tests đã qua; chi tiết phạm vi xem `idea-feature-audit.md`.

Tài liệu: [Render Docker](https://render.com/docs/docker), [Blueprint](https://render.com/docs/blueprint-spec), [Persistent disks](https://render.com/docs/disks), [Custom domains](https://render.com/docs/custom-domains).
