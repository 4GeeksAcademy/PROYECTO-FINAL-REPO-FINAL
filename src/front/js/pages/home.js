import React from "react";
import "../../styles/home.css";
import { Link } from "react-router-dom";
import Header from "../../img/homeimg.png";
import Stepper1 from "../../img/stepper1.png"
import Stepper2 from "../../img/stepper2.png"
import Stepper3 from "../../img/stepper3.png"
import Footer1 from "../../img/foot1.png"
import Footer2 from "../../img/foot2.png"
import Footer3 from "../../img/foot3.png"
import Footer4 from "../../img/foot4.png"


export const Home = () => {



  return (
    <div className="home-container ">
      {/* Header Section */}
      <div className=" header-home text-center">
        <h1 className="home-title">It's time to create your<br />
          amazing surveys
        </h1>
        <p className="lead">
          Organize a dinner party, get insight from your users for your small business, and much more.
        </p>
        <Link to="/register" className="btn btn-lg home-signup-btn">Get started</Link>
        <div className="col-12 col-sm-6 col-md-4 mb-4 headerimg">
          <img src={Header} alt="header-img" className="img-fluid header-img"></img>
        </div>
      </div>
      {/* Feature Highlights Section */}
      <div className=" why-part">
        <p className="why-evote text-center">Why SurveyHUB?</p>
        <p className="why-text text-center">“Participating in our surveys is easy: simply sign up, choose the surveys that interest you<br />
          most, share your opinions and start earning rewards for every answer you complete.”</p>
        <div className="container card-container">
          <div className="card1" >
            <div className="card home-cards mb-4">
              <h1>Easy to use.</h1>
              <p>
                The application has a clean and accessible design that makes it easy to navigate, allowing beginners and experts to create surveys without the need for technical training.
              </p>
            </div>
          </div>
          <div className="card2">
            <div className="card home-cards mb-4">
              <h1>Real-time Analytics.</h1>
              <p>
                A key advantage is real-time data analysis. Our application provides instant graphs and statistics as survey responses come in, enabling quick understanding of opinions and immediate decision-making.
              </p>
            </div>
          </div>
          <div className="card3">
            <div className="card home-cards mb-4">
              <h1>Customization and Flexibility</h1>
              <p>
                Our application offers flexibility and customization to meet your needs. You can create surveys with various question formats, like multiple choice or open-ended, and incorporate your branding to reflect your identity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Example Roadmap Section */}
      <div className="work-part ">
        <h2 className="mb-4 text-center">How we work?</h2>
        <p className="text-center how-text">“Participating in our surveys is easy: simply sign up, choose the surveys that interest you <br />
          most, share your opinions and start earning rewards for every answer you complete.”</p>
        <div className="card-stepper col-12 col-sm-6 col-md-12">
          <img src={Stepper1} alt="Imagen" className="img-fluid img-stepper1"></img>
          <div className="stepper-box1">
            <div className="container circle">1</div>
            <div className="stepper-line"></div>
          </div>
          <div className="stepper-text">
            <h3>Start creating your survey</h3>
            <p>At this stage, it's important to think about the objective of your survey and the information you wish to collect. You can choose from different types of questions, such as multiple choice,
              open-ended responses, or scales, allowing you to gather valuable and specific data.
              Once you're ready, simply follow the on-screen instructions to start adding your questions and customizing your survey before moving on to the next steps.
            </p>
            <Link to="/register" className="stepper-link ">Get started</Link>

          </div>
        </div>
        <div className="card-stepper col-12 col-sm-6 col-md-12">
          <img src={Stepper3} alt="Imagen" className="img-fluid img-stepper1"></img>
          <div className="stepper-box1">
            <div className="container circle">2</div>
            <div className="stepper-line"></div>
          </div>
          <div className="stepper-text">
            <h3>Make public or private</h3>
            <p>Now that you have created your survey, it is time to decide its visibility. If you choose to make it public, anyone will be able to access it and participate, allowing you to get a variety of opinions. On the other hand, if you decide to keep it private, only the people you directly invite will be able to respond, which is ideal for more specific or exclusive surveys. 
              Select the option that best suits your needs and start collecting responses.
            </p>
            <Link to="/register" className="stepper-link ">Get started</Link>
          </div>
        </div>
        <div className="card-stepper col-12 col-sm-6 col-md-12">
          <img src={Stepper2} alt="Imagen" className="img-fluid img-stepper1"></img>
          <div className="stepper-box1">
            <div className="container circle">3</div>
          </div>
          <div className="stepper-text">
            <h3>Collect all the data</h3>
            <p>Once your survey is ready and you have decided on its visibility, it's time to start collecting data. Share your survey link with participants and encourage them to respond. As you receive the responses, our application will take care of storing all the data in a secure and organized way.
              Remember that you can track progress in real time and adjust any aspect of the survey to maximize participation - don't miss the opportunity to gain valuable information!
            </p>
            <Link to="/register" className="stepper-link ">Get started</Link>
          </div>
        </div>
      </div>
      <div className="home-foot">
        <p className="text-foot text-center">SurveyHUB help you to help</p>
        <div className="foot-img">
          <img src={Footer1} alt="Imagen" className=" img-homefooter "></img>
          <img src={Footer2} alt="Imagen" className=" img-homefooter "></img>
          <img src={Footer3} alt="Imagen" className=" img-homefooter "></img>
          <img src={Footer4} alt="Imagen" className=" img-homefooter "></img>
        </div>
      </div>
    </div>
  );
};