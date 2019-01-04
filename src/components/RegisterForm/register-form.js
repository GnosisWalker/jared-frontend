import React, { Component } from "react";
import { observer } from "mobx-react";
import signUpStore from "../../stores/SignUpStore";
import authStore from "../../stores/AuthStore";
import "./register-form.css";
import { Redirect } from "react-router-dom";
import userStore from "../../stores/UserStore";
import ErrorMessage from "../ErrorMessage/error-message";

let registerErrorMessage= false;
let registerSuccessMessage = false;

const RegisterForm = observer(
  class RegisterForm extends Component {
    constructor(props) {
      super(props);
      this.handleChange = this.handleChange.bind(this);
      this.state = { errorText: "" };
      signUpStore.navigate = false;
      signUpStore.clear();
    }

    handleChange(e) {
      signUpStore[e.target.name] = e.target.value;
    }

    register = async () => {
      this.setState({ errorText: ""});
      if (signUpStore.password === signUpStore.repeatPassword) {
        await authStore.register({
          username: signUpStore.username,
          email: signUpStore.email,
          password: signUpStore.password
        })
          .then((response) => {
            registerSuccessMessage = true;
            // once registered, set authStore credentials
            authStore.setUserAuth(response.data.data);
            userStore.setUserLogged(response.data.data)
            signUpStore.navigate = true;
          })
          .catch((error) => {
            const err =  (Array.isArray(error.response.data.errors)) ?
                error.response.data.errors[0].message :
                error.response.data.errors.message;
            // TODO: show error
          });
      } else {
        this.setState({errorText: JSON.stringify( {"errors":[{"message":"Password do not match"}]})})
      }
    }


    render() {
      if (signUpStore.navigate) {
        return <Redirect to={{ pathname: "/home", state: { registerSuccessMessage: registerSuccessMessage } }} push={true} />;
      }
      return (
        <div className="form-div">
          <div className="ui middle aligned center aligned grid">
            <div className="column">
              <h2 className="ui image header">
                <div className="content">Create a new account</div>
              </h2>
              <form className="ui form">
                <div className="ui stacked secondary  segment">
                  <div
                    className={registerErrorMessage ? "field error" : "field"}
                  >
                    <div className="ui left icon input">
                      <i className="mail icon" />
                      <input
                        type="email"
                        name="email"
                        value={signUpStore.email}
                        placeholder="Email address"
                        onChange={this.handleChange}
                      />
                    </div>
                  </div>
                  <div
                    className={registerErrorMessage ? "field error" : "field"}
                  >
                    <div className="ui left icon input">
                      <i className="user icon" />
                      <input
                        type="text"
                        name="username"
                        value={signUpStore.username}
                        placeholder="Username"
                        onChange={this.handleChange}
                      />
                    </div>
                  </div>
                  <div
                    className={registerErrorMessage ? "field error" : "field"}
                  >
                    <div className="ui left icon input">
                      <i className="lock icon" />
                      <input
                        type="password"
                        name="password"
                        value={signUpStore.password}
                        placeholder="Password"
                        onChange={this.handleChange}
                      />
                    </div>
                  </div>
                  <div
                    className={registerErrorMessage ? "field error" : "field"}
                  >
                    <div className="ui left icon input">
                      <i className="lock icon" />
                      <input
                        type="password"
                        name="repeatPassword"
                        value={signUpStore.repeatPassword}
                        placeholder="Repeat Password"
                        onChange={this.handleChange}
                      />
                    </div>
                  </div>
                  <div
                    className="ui fluid large teal submit button"
                    onClick= { this.register}
                  >
                    Create
                  </div>
                </div>
              </form>
              { this.state.errorText ? (
                <ErrorMessage message = { this.state.errorText } />
              ) : null}
              <div className="ui message">
                Forgot your password?{" "}
                <a href="/forgot_password">
                  Click Here
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
);

export default RegisterForm;