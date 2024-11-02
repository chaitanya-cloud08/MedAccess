import express from "express"; 
import bodyParser from "body-parser";
import session from "express-session";
import db from './db.js';
import bcrypt from 'bcrypt';

const app = express();
const port = 3000;



app.use(express.static('assets'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


app.use(session({
    secret: 'your-secret-key', // replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production when using HTTPS
}));

const appointments = [];
let isAuthenticated = false;

app.get('/',(req,res)=>
{
    res.render('index.ejs');
})

app.get('/about',(req,res)=>
{
    res.render('about.ejs')
})

app.get('/profile',(req,res)=>
{
    res.render('profile.ejs')
})

app.get('/services',(req,res)=>
{
    res.render('services.ejs');
})

app.get('/faq',(req,res)=>
{
    res.render('faq.ejs');
})

app.get('/user',(req,res)=>
{
    res.render('user.ejs');
})

// Route to render appointment form
app.get('/appointment', (req, res) => {
    res.render("appointment.ejs");
});

// Route to handle appointment submission
app.post('/submit-appointment', (req, res) => {
    console.log("Form is submitted", req.body);
    const appointmentData = {
        name: req.body.name,
        email: req.body.email,
        date: req.body.date,
        time: req.body.time,
        mobile: req.body.mobile,
        department: req.body.department,
    };

  const sql = "INSERT INTO appointments (name,email,date,time,mobile,department) VALUES (?,?,?,?,?,?)";
  const values = [appointmentData.name, appointmentData.email, appointmentData.date, appointmentData.time, appointmentData.mobile, appointmentData.department];
  
  db.query(sql,values,(error,results)=>
{
    if(error)
    {
        console.error("Error saving appointment:",error);
        res.send("Error saving appointment, please try again");
    }
  else
  {
    console.log("Appointment saved to database:",results);
    res.send(`<script>alert("Appointment booked successfully");
        window.location.href="/appointment";</script>`);
  }  
})








//     appointments.push(appointmentData);
//      console.log("All appointments:", appointments);
//     // Log the department to check its value
//     const department = req.body.department;
//     console.log("Selected Department:", department); 
//     const doctorAppointments = appointments.filter(appointment=> appointment.department=== department);

//  res.send(`<script>alert("Appointment booked successfully");
//     window.location.href="/appointment";
//     </script>`);





// switch(department)
// {
//     case 'Pediatrician': 
//     res.redirect(`/doctor?name=Ethan`);
//     break;




//     case 'Gynaecology' :
//         res.redirect(`/doctor?name=Olivia`)
//         break;
  
//     case 'Pathology' :
//         res.redirect(`/doctor?name=Noah`)
//         break;
    
//     case 'ENT' :
//         res.redirect(`/doctor?name=Sophia`)
//        break;
 
//        default: 
//        res.redirect(`/doctor?name=FallbackDoctor`)
//        break;


// }
});

app.get('/doctor', (req, res) => {
    const name = req.query.name || "FallbackDoctor"; // Get the doctor's name from the query

    // Map doctor names to their respective departments
    const doctorDepartments = {
        "Ethan": "Pediatrician",
        "Olivia": "Gynaecology",
        "Noah": "Pathology",
        "Sophia": "ENT"
    };

    // Get the department associated with the selected doctor
    const department = doctorDepartments[name];

    // Query appointments for the specific department
    const sql = "SELECT * FROM appointments WHERE department = ?";
    db.query(sql, [department], (err, filteredAppointments) => {
        if (err) {
            console.error("Error fetching appointments:", err);
            return res.send('Error fetching appointments. Please try again.');
        }

        // Count the number of appointments
        const appointmentsCount = filteredAppointments.length;

        // Render doctor.ejs with the doctor's name and filtered appointments
        res.render('doctor', {
            name: name,
            appointments: filteredAppointments,
            appointmentsCount: appointmentsCount
        });
    });
});


// Route to render admin page
app.get('/docadmin', (req, res) => {
    res.render('docadmin'); // Render docadmin.ejs
});

app.post('/submit-doc', (req, res) => {
    // const name = req.body.name;  // Get the name from the form's 'name' input
    // console.log("Doctor's name from form:", name);  // Log the name for debugging
    const { name, email, password } = req.body;
  // Check if credentials match
  if (name === "Chaitanya" && email === "admin123@gmail.com" && password === "admin123") {
    isAuthenticated = true; // Set authenticated flag to true
    console.log("Admin logged in successfully!");
    res.redirect('/admin'); // Redirect to admin page
  }
    // Check if the name is present, then redirect
    else if (name!=="Chaitanya") {
        res.redirect(`/doctor?name=${encodeURIComponent(name)}`);  // Pass name in query string
    } else {
        res.send('Name not found in form submission!');
    }
});

app.get('/admin', (req, res) => {
    if (isAuthenticated) {
        const sqlAppointments = "SELECT * FROM appointments";
        const sqlEnquiries = "SELECT * FROM enquiries";
        
        // Execute both queries in parallel
        db.query(sqlAppointments, (error, appointmentResults) => {
            if (error) {
                console.error("Error fetching appointment data:", error);
                return res.send('Error fetching appointment data. Please try again.');
            }

            db.query(sqlEnquiries, (error, enquiryResults) => {
                if (error) {
                    console.error("Error fetching enquiry data:", error);
                    return res.send('Error fetching enquiry data. Please try again.');
                }

                // Count the number of rows for appointments and enquiries
                const appointmentsCount = appointmentResults.length;
                const enquiriesCount = enquiryResults.length;

                // Render the admin page with data and counts
                res.render('admin', {
                    appointments: appointmentResults,
                    enquiries: enquiryResults,
                    appointmentsCount: appointmentsCount,
                    enquiriesCount: enquiriesCount
                });
            });
        });
    } else {
        console.log("Access denied: Not authenticated");
        res.send('Access denied. Please log in first.');
    }
});


app.get('/login',(req,res)=>
{
    res.render('login');
})



app.post('/signup', async(req,res)=>
{
    const {name, email, password} = req.body;
    const hashedPassword = await bcrypt.hash(password,8);


const sql = 'INSERT INTO users (name,email,password) VALUES (?,?,?)';

db.query(sql,[name,email,hashedPassword], (err,result)=>
{
    if(err)
    {
        console.error('Error during signup:',err);
        return res.status(500).send('User registration failed');
    }
    res.status(200).send('User registered successfully');
});

});

app.post('/loginpage', async (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                req.session.userEmail = user.email; // Store user email in session
                
                // Fetch appointments associated with this email
                const appointmentQuery = 'SELECT * FROM appointments WHERE email = ?';
                db.query(appointmentQuery, [email], (err, appointments) => {
                    if (err) {
                        console.error("Error fetching appointments:", err);
                        return res.status(500).send('Error fetching appointments. Please try again.');
                    }

                    // Render patient.ejs and pass appointment data
                    res.render('patient', { appointments, patientName : user.name });
                });
            } else {
                return res.status(401).send('Invalid email or password');
            }
        } else {
            return res.status(401).send('Invalid email or password');
        }
    });
});

app.get('/patient',(req,res)=>
{
    res.render('patient');
});

app.post('/submit-enquiry', (req, res) => {
    console.log("Form is submitted", req.body);
    const EnquiryData = {
        enqtype : req.body.enqtype,
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        remarks: req.body.remarks,
    };

  const sql = "INSERT INTO enquiries(enquiry_type,user_name,email_id,mobile_no,remarks) VALUES (?,?,?,?,?)";
  const values = [EnquiryData.enqtype,EnquiryData.name, EnquiryData.email, EnquiryData.mobile, EnquiryData.remarks];
  
  db.query(sql,values,(error,results)=>
{
    if(error)
    {
        console.error("Error saving enquiry:",error);
        res.send("Error saving enquiry, please try again");
    }
  else
  {
    console.log("Enquiry saved to database:",results);
    res.send(`<script>alert("Enquiry done successfully");
        window.location.href="/faq";</script>`);
  }  
})

});





















// Start the server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
