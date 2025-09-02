# Manual Testing Steps for Candidate Portal

## Quick Testing Steps:

### 1. Create Test Candidate
- Go to `/candidates` in admin panel
- Add new candidate:
  - Name: **John Doe** 
  - Email: **john.doe@test.com**
  - Phone: **+1234567890**
  - Primary Skill: **Developer**

### 2. Set Portal Password
- Open candidate edit page
- Set password: **test123**
- Enable "Portal Active" checkbox
- Save

### 3. Test Portal Access
- Go to `/portal`
- Login: **john.doe@test.com** / **test123**
- Should see dashboard

### 4. Test Full Flow
- Create job application for this candidate
- Create interview for application  
- Create offer letter
- Check portal shows all data

### 5. Check These Work:
- [ ] Login page loads
- [ ] Dashboard shows stats
- [ ] Applications display
- [ ] Interviews show up
- [ ] Offers appear
- [ ] Accept/decline buttons work
- [ ] Logout works

**Tell me which step fails and I'll fix it!**