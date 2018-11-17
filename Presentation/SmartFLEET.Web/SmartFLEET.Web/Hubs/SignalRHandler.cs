﻿using System.Data.Entity;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNet.SignalR;
using SmartFleet.Core.Contracts.Commands;
using SmartFleet.Core.Data;
using SmartFleet.Core.Domain.Gpsdevices;
using SmartFleet.Core.ReverseGeoCoding;
using SmartFleet.Data;
using SmartFLEET.Web.Models;

namespace SmartFLEET.Web.Hubs
{
    public class SignalRHandler : Hub,
        IConsumer<CreateTk103Gps>,
        IConsumer<CreateNewBoxGps>
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        public async Task Consume(ConsumeContext<CreateTk103Gps> context)
        {

            var reverseGeoCodingService = new ReverseGeoCodingService();
            await reverseGeoCodingService.ReverseGeoCoding(context.Message);
            using (var dbContextScopeFactory = SignalRHubManager.DbContextScopeFactory.Create())
            {
                // get current gps device 
                var box = await GetSenderBox(context.Message, dbContextScopeFactory);
                if (box != null)
                {
                    // set position 
                    var position = new PositionViewModel(context.Message, box.Vehicle);
                    await SignalRHubManager.Clients.Group(position.CustomerName).receiveGpsStatements(position);
                }
            }

        }

        private static async Task<Box> GetSenderBox(CreateTk103Gps message, IDbContextScope dbContextScopeFactory)
        {
            var dbContext = dbContextScopeFactory.DbContexts.Get<SmartFleetObjectContext>();
            var box = await dbContext.Boxes.Include(x => x.Vehicle).Include(x => x.Vehicle.Customer).FirstOrDefaultAsync(b =>
                b.SerialNumber == message.SerialNumber);
            return box;
        }

        private static async Task<Box> GetSenderBox(CreateNewBoxGps message, IDbContextScope dbContextScopeFactory)
        {
            var dbContext = dbContextScopeFactory.DbContexts.Get<SmartFleetObjectContext>();
            var box = await dbContext.Boxes.Include(x => x.Vehicle).Include(x => x.Vehicle.Customer).FirstOrDefaultAsync(b =>
                b.Imei == message.IMEI);
            return box;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="groupName"></param>
        public void Join(string groupName)
        {
            Groups.Add(Context.ConnectionId, groupName);
            SignalRHubManager.Clients = Clients;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="stopCalled"></param>
        /// <returns></returns>
        public override  Task OnDisconnected(bool stopCalled)
        {
             SignalRHubManager.Clients = Clients;
            return base.OnDisconnected(stopCalled);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        public async Task Consume(ConsumeContext<CreateNewBoxGps> context)
        {
            var reverseGeoCodingService = new ReverseGeoCodingService();
           var r= await reverseGeoCodingService.ExecuteQuery(context.Message.Latitude, context.Message.Longitude);
            context.Message.Address = r.display_name;
            using (var dbContextScopeFactory = SignalRHubManager.DbContextScopeFactory.Create())
            {
                // get current gps device 
                var box = await GetSenderBox(context.Message, dbContextScopeFactory);
                if (box != null)
                {
                    // set position 
                    var position = new PositionViewModel(context.Message, box.Vehicle);
                    await SignalRHubManager.Clients.Group(position.CustomerName).receiveGpsStatements(position);
                }
            }
        }
    }
}