﻿using System;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using AutoMapper;
using SmartFleet.Data;
using SmartFLEET.Web.Areas.Administrator.Models;

namespace SmartFLEET.Web.Controllers
{
    public class BaseController : Controller
    {
        protected readonly SmartFleetObjectContext ObjectContext;
        protected readonly IMapper Mapper;

        public BaseController(SmartFleetObjectContext objectContext)
        {
            ObjectContext = objectContext;
        }
        public BaseController(SmartFleetObjectContext objectContext, IMapper mapper)
        {
            ObjectContext = objectContext;
            Mapper = mapper;
        }
        public BaseController( IMapper mapper)
        {
            Mapper = mapper;
        }

        public ValidationViewModel ValidationViewModel()
        {
            ValidationViewModel validationModel;
            var errors = (from modelStateValue in ModelState.Values
                from error in modelStateValue.Errors
                select error.ErrorMessage).ToList();
            validationModel = new ValidationViewModel(errors, "Validation errors");
            return validationModel;
        }

    }
}