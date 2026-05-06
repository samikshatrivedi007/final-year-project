git clone https://github.com/samikshatrivedi007/final-year-project.git
cd final-year-project

#Dhruv's Code

#deploy code
# Backend
cd server
cp .env.example .env   # fill in your MongoDB URL + JWT secret
npm install
npm run dev

# Frontend (new terminal)
cd ../client
npm install
npm run dev
